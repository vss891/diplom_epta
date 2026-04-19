from flask import Flask, request, jsonify
from flask_cors import CORS
import pandas as pd
import numpy as np
import skfuzzy as fuzz
from werkzeug.utils import secure_filename
import os
import jwt
from datetime import datetime, timedelta
from functools import wraps
import bcrypt

app = Flask(__name__)
CORS(app, expose_headers=['Authorization'], allow_headers=['Content-Type', 'Authorization'])

UPLOAD_FOLDER = 'uploads'
ALLOWED_EXTENSIONS = {'csv', 'xlsx', 'xls'}
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY', 'your-secret-key-change-in-production')
app.config['JWT_EXPIRATION_HOURS'] = 24

if not os.path.exists(UPLOAD_FOLDER):
    os.makedirs(UPLOAD_FOLDER)

# Временное хранилище пользователей (в реальном проекте — база данных)
users = {
    'admin': bcrypt.hashpw('password'.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
}

def hash_password(password):
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

def check_password(hashed, password):
    return bcrypt.checkpw(password.encode('utf-8'), hashed.encode('utf-8'))

def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        token = request.headers.get('Authorization')
        if not token:
            return jsonify({'error': 'Token is missing'}), 401
        try:
            token = token.split(' ')[1]  # Bearer <token>
            data = jwt.decode(token, app.config['SECRET_KEY'], algorithms=['HS256'])
            current_user = data['username']
        except:
            return jsonify({'error': 'Token is invalid'}), 401
        return f(current_user, *args, **kwargs)
    return decorated

def allowed_file(filename):
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def read_excel_or_csv(file_path, sheet_name=None):
    """Читает Excel (xlsx, xls) или CSV файл и возвращает DataFrame."""
    try:
        if file_path.endswith('.csv'):
            df = pd.read_csv(file_path)
        elif file_path.endswith(('.xlsx', '.xls')):
            if sheet_name is None:
                df = pd.read_excel(file_path, sheet_name=0)
                if isinstance(df, dict):
                    first_sheet_name = next(iter(df))
                    df = df[first_sheet_name]
            else:
                df = pd.read_excel(file_path, sheet_name=sheet_name)
                if isinstance(df, dict):
                    first_sheet_name = next(iter(df))
                    df = df[first_sheet_name]
        else:
            raise ValueError("Unsupported file type")
        return df
    except Exception as e:
        print(f"Ошибка при чтении файла: {e}")
        return None

def create_membership_functions(values):
    """Создает функции принадлежности для нечеткой логики."""
    universe = np.arange(np.min(values), np.max(values) + 1, 1)
    vl_mf = fuzz.trimf(universe, [np.min(values), np.min(values), np.min(values) + 0.25 * (np.max(values) - np.min(values))])
    l_mf = fuzz.trimf(universe, [np.min(values), np.min(values) + 0.25 * (np.max(values) - np.min(values)), np.min(values) + 0.5 * (np.max(values) - np.min(values))])
    m_mf = fuzz.trimf(universe, [np.min(values) + 0.25 * (np.max(values) - np.min(values)), np.min(values) + 0.5 * (np.max(values) - np.min(values)), np.min(values) + 0.75 * (np.max(values) - np.min(values))])
    h_mf = fuzz.trimf(universe, [np.min(values) + 0.5 * (np.max(values) - np.min(values)), np.min(values) + 0.75 * (np.max(values) - np.min(values)), np.max(values)])
    vh_mf = fuzz.trimf(universe, [np.min(values) + 0.75 * (np.max(values) - np.min(values)), np.max(values), np.max(values)])
    return universe, vl_mf, l_mf, m_mf, h_mf, vh_mf

def fuzzify_values(values, vl_mf, l_mf, m_mf, h_mf, vh_mf):
    """Фаззификация значений."""
    fuzzified = []
    for v in values:
        vl = fuzz.interp_membership(np.arange(np.min(values), np.max(values) + 1, 1), vl_mf, v)
        l = fuzz.interp_membership(np.arange(np.min(values), np.max(values) + 1, 1), l_mf, v)
        m = fuzz.interp_membership(np.arange(np.min(values), np.max(values) + 1, 1), m_mf, v)
        h = fuzz.interp_membership(np.arange(np.min(values), np.max(values) + 1, 1), h_mf, v)
        vh = fuzz.interp_membership(np.arange(np.min(values), np.max(values) + 1, 1), vh_mf, v)
        memberships = {'VL': vl, 'L': l, 'M': m, 'H': h, 'VH': vh}
        term = max(memberships, key=memberships.get)
        fuzzified.append({
            'value': float(v),
            'VL': float(vl),
            'L': float(l),
            'M': float(m),
            'H': float(h),
            'VH': float(vh),
            'term': term
        })
    return fuzzified

def verify_transitions(terms, max_length=7):
    """Верификация переходов."""
    transitions = {}
    for l in range(1, max_length + 1):
        for i in range(l, len(terms)):
            config = ''.join(terms[i - l:i])
            next_state = terms[i]
            if config not in transitions:
                transitions[config] = {'VL': 0, 'L': 0, 'M': 0, 'H': 0, 'VH': 0}
            transitions[config][next_state] += 1
    return transitions

def get_transitions(config, fuzzified_values, index, window_size):
    """Вспомогательная функция для получения переходов."""
    transitions = {}
    for i in range(index - window_size, index):
        next_state = fuzzified_values[i]['term']
        if next_state not in transitions:
            transitions[next_state] = 0
        transitions[next_state] += 1
    return transitions

def calculate_probabilities(transitions):
    """Вычисление вероятностей."""
    total = sum(transitions.values())
    if total == 0:
        return {'VL': 0, 'L': 0, 'M': 0, 'H': 0, 'VH': 0}
    return {state: count / total for state, count in transitions.items()}

def predict_next_state(probabilities):
    """Предсказание следующего состояния."""
    return max(probabilities, key=probabilities.get)

def defuzzify_prediction(state, recent_values):
    """Дефаззификация предсказания."""
    if state == 'VL':
        return float(np.min(recent_values))
    elif state == 'L':
        return float(np.min(recent_values) + 0.25 * (np.max(recent_values) - np.min(recent_values)))
    elif state == 'M':
        return float(np.mean(recent_values))
    elif state == 'H':
        return float(np.min(recent_values) + 0.75 * (np.max(recent_values) - np.min(recent_values)))
    elif state == 'VH':
        return float(np.max(recent_values))

def validate_values(values, time_labels, fuzzified_values, max_length=7, threshold=10):
    """Валидация значений."""
    validation_results = []
    window_size = max_length
    for i in range(window_size, len(values)):
        current_config = ''.join([fv['term'] for fv in fuzzified_values][i - window_size:i])
        transitions = get_transitions(current_config, fuzzified_values, i, window_size)
        probabilities = calculate_probabilities(transitions)
        predicted_state = predict_next_state(probabilities)
        forecast_value = defuzzify_prediction(predicted_state, values[i - window_size:i])
        real_value = float(values[i])
        guessed = abs(forecast_value - real_value) < threshold
        difference = abs(forecast_value - real_value)
        validation_results.append({
            'time_label': str(time_labels[i]),
            'l_config': current_config,
            'transitions': transitions,
            'probabilities': probabilities,
            'predicted_state': predicted_state,
            'forecast_value': forecast_value,
            'real_value': real_value,
            'guessed': bool(guessed),
            'difference': float(difference)
        })
    return validation_results

def apply_lka(values):
    """Применение ЛКА."""
    lka_values = []
    for i in range(len(values)):
        if i == 0:
            lka_values.append((values[i] + values[i + 1]) / 2)
        elif i == len(values) - 1:
            lka_values.append((values[i - 1] + values[i]) / 2)
        else:
            lka_values.append((values[i - 1] + values[i] + values[i + 1]) / 3)
    return np.array(lka_values)

def calculate_moving_average(values, window_size=3):
    """Вычисление скользящего среднего."""
    moving_averages = []
    for i in range(len(values)):
        start = max(0, i - window_size + 1)
        end = min(i + 1, len(values))
        window = values[start:end]
        moving_averages.append(np.mean(window))
    return np.array(moving_averages)

@app.route('/api/register', methods=['POST'])
def register():
    data = request.get_json()
    username = data.get('username')
    password = data.get('password')

    if not username or not password:
        return jsonify({'error': 'Username and password required'}), 400

    if username in users:
        return jsonify({'error': 'Username already exists'}), 409

    hashed = hash_password(password)
    users[username] = hashed
    return jsonify({'message': 'User created successfully'}), 201

@app.route('/api/login', methods=['POST'])
def login():
    data = request.get_json()
    username = data.get('username')
    password = data.get('password')

    if not username or not password:
        return jsonify({'error': 'Username and password required'}), 400

    hashed = users.get(username)
    if not hashed or not check_password(hashed, password):
        return jsonify({'error': 'Invalid credentials'}), 401

    token = jwt.encode(
        {
            'username': username,
            'exp': datetime.utcnow() + timedelta(hours=app.config['JWT_EXPIRATION_HOURS'])
        },
        app.config['SECRET_KEY'],
        algorithm='HS256'
    )

    return jsonify({'token': token, 'username': username})

@app.route('/analyze', methods=['POST'])
@token_required
def analyze(current_user):
    if 'file' not in request.files:
        return jsonify({'error': 'No file part'}), 400

    file = request.files['file']
    if file.filename == '':
        return jsonify({'error': 'No selected file'}), 400

    if file and allowed_file(file.filename):
        filename = secure_filename(file.filename)
        filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
        file.save(filepath)

        df = read_excel_or_csv(filepath)
        if df is None:
            if os.path.exists(filepath):
                os.remove(filepath)
            return jsonify({'error': 'Could not read the file. Check format (CSV, XLSX, XLS).'}), 500

        if df.empty:
            os.remove(filepath)
            return jsonify({'error': 'File is empty.'}), 500

        if df.shape[1] < 2:
            os.remove(filepath)
            return jsonify({'error': 'File must have at least two columns (time, value)'}), 400

        time_labels = df.iloc[:, 0].values
        values = df.iloc[:, 1].values.astype(float)

        # Блочная обработка
        block_size = 15
        all_fuzzified_values = []
        for i in range(0, len(values), block_size):
            current_values = values[i:i + block_size]
            if len(current_values) == 0:
                continue
            universe, vl_mf, l_mf, m_mf, h_mf, vh_mf = create_membership_functions(current_values)
            current_fuzzified = fuzzify_values(current_values, vl_mf, l_mf, m_mf, h_mf, vh_mf)
            all_fuzzified_values.extend(current_fuzzified)

        terms = [item['term'] for item in all_fuzzified_values]
        verification_results = verify_transitions(terms)
        validation_results = validate_values(values, time_labels, all_fuzzified_values)

        # Дополнительные расчеты
        start_index = 5
        truncated_values = values[start_index:]
        lka_values = apply_lka(truncated_values)
        moving_averages = calculate_moving_average(truncated_values)
        truncated_time_labels = time_labels[start_index:]

        fuzz_results_for_chart = [
            {'index': i, 'time_label': str(time_labels[i]), 'value': float(values[i]), 'term': all_fuzzified_values[i]['term']}
            for i in range(len(values))
        ]

        os.remove(filepath)

        return jsonify({
            'success': True,
            'fuzzification_data': fuzz_results_for_chart,
            'verification_data': verification_results,
            'validation_data': validation_results,
            'lka_data': [{'time_label': str(truncated_time_labels[i]), 'lka_value': float(lka_values[i])} for i in range(len(lka_values))],
            'moving_average_data': [{'time_label': str(truncated_time_labels[i]), 'ma_value': float(moving_averages[i])} for i in range(len(moving_averages))]
        })
    else:
        return jsonify({'error': 'File type not allowed'}), 400

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)