import os
from flask import Flask, render_template, request, redirect, url_for, flash, jsonify
from flask_bcrypt import Bcrypt
from flask_login import LoginManager, UserMixin, login_user, login_required, logout_user, current_user
from werkzeug.utils import secure_filename
from mutagen.easyid3 import EasyID3
from mutagen.flac import FLAC
from mutagen.wavpack import WavPack
from database import db, User, Music, global_init, create_session

app = Flask(__name__)
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///users.db'
app.config['SECRET_KEY'] = 'supersecretkey'
app.config['UPLOAD_MUSIC_FOLDER'] = 'static/music/'
app.config['UPLOAD_COVER_FOLDER'] = 'static/covers/'

ALLOWED_EXTENSIONS = {'mp3', 'wav', 'flac'}
MAX_FILE_SIZE = {
    'mp3': 10 * 1024 * 1024,
    'wav': 10 * 1024 * 1024,
    'flac': 50 * 1024 * 1024
}

db.init_app(app)
bcrypt = Bcrypt(app)
login_manager = LoginManager(app)
login_manager.login_view = 'login'


@login_manager.user_loader
def load_user(user_id):
    with db.session() as session:
        return session.get(User, int(user_id))


def allowed_file_music(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def allowed_file_cover(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ['jpg', 'jpeg', 'png']



def extract_metadata(filepath, file_ext):
    try:
        if file_ext == 'mp3':
            audio = EasyID3(filepath)
        elif file_ext == 'flac':
            audio = FLAC(filepath)
        elif file_ext == 'wav':
            audio = WavPack(filepath)
        else:
            return None, None

        title = audio.get('title', [None])[0]
        artist = audio.get('artist', [None])[0]
        return title, artist
    except Exception:
        return None, None

@app.route('/')
def index():
    return redirect(url_for('dashboard'))

@app.route('/register', methods=['GET', 'POST'])
def register():
    if request.method == 'POST':
        username = request.form['username']
        email = request.form['email']
        password = request.form['password']

        existing_user = User.query.filter_by(email=email).first()
        if existing_user:
            flash('Пользователь с таким email уже существует.', 'danger')
            return redirect(url_for('register'))

        hashed_password = bcrypt.generate_password_hash(password).decode('utf-8')
        user = User(username=username, email=email, password_hash=hashed_password)
        db.session.add(user)
        db.session.commit()
        flash('Регистрация успешна! Теперь войдите в систему.', 'success')
        return redirect(url_for('login'))

    return render_template('register.html', title='Регистрация')

@app.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        email = request.form['email']
        password = request.form['password']
        user = User.query.filter_by(email=email).first()
        if user and bcrypt.check_password_hash(user.password_hash, password):
            login_user(user)
            flash('Вы вошли в систему!', 'success')
            return redirect(url_for('dashboard'))
        else:
            flash('Неверный email или пароль', 'danger')
    return render_template('login.html', title='Вход')


@app.route('/edit_track/<int:track_id>', methods=['POST'])
def edit_track(track_id):
    db_sess = create_session()
    track = db_sess.query(Music).filter(Music.id == track_id).first()
    if not track or track.user_id != current_user.id:
        return jsonify({"success": False, "message": "Трек не найден или у вас нет доступа к этому треку"}), 403

    # Получаем данные из формы
    track_title = request.form.get('trackTitle')
    track_author = request.form.get('trackAuthor')
    track_cover = request.files.get('trackCover')

    # Обновляем данные трека
    if track_title != "Неизвестный трек":
        track.track_title = track_title
    if track_author != "Неизвестный исполнитель":
        track.track_author = track_author

    if track_cover and allowed_file_cover(track_cover.filename):
        user_folder = os.path.join(app.config['UPLOAD_COVER_FOLDER'], str(current_user.id))
        if not os.path.exists(user_folder):
            os.makedirs(user_folder)

        filename = secure_filename(track_cover.filename)
        cover_path = os.path.join(user_folder, filename)
        track_cover.save(cover_path)
        track.cover_path = cover_path

    db_sess.commit()
    db_sess.close()

    return jsonify({"success": True, "message": "Трек успешно обновлен"})

@app.route('/dashboard', methods=['GET', 'POST'])
@login_required
def dashboard():
    if request.method == 'POST':
        if 'file' not in request.files:
            flash(' Файл не выбран', 'danger')
            return redirect(url_for('dashboard'))
        file = request.files['file']
        if file.filename == '' or not allowed_file_music(file.filename):
            flash('Неверный формат файла', 'danger')
            return redirect(url_for('dashboard'))
        file_ext = file.filename.rsplit('.', 1)[1].lower()
        if file_ext not in ALLOWED_EXTENSIONS:
            flash('Неверный формат файла', 'danger')
            return redirect(url_for('dashboard'))

        if len(file.read()) > MAX_FILE_SIZE[file_ext]:
            flash('Файл слишком большой', 'danger')
            return redirect(url_for('dashboard'))
        file.seek(0)
        new_track = Music(user_id=current_user.id, file_path='')
        db.session.add(new_track)
        db.session.commit()
        user_folder = os.path.join(app.config['UPLOAD_MUSIC_FOLDER'], str(current_user.id))
        os.makedirs(user_folder, exist_ok=True)
        file_path = os.path.join(user_folder, f"{new_track.id}.{file_ext}")
        file.save(file_path)
        title, artist = extract_metadata(file_path, file_ext)
        new_track.file_path = file_path
        new_track.track_title = title
        new_track.track_author = artist
        db.session.commit()
        flash('Файл успешно загружен!', 'success')
        return redirect(url_for('dashboard'))

    tracks = Music.query.filter_by(user_id=current_user.id).all()
    return render_template('dashboard.html', tracks=tracks)


@app.route('/logout')
@login_required
def logout():
    logout_user()
    flash('Вы вышли из системы.', 'info')
    return redirect(url_for('login'))


if __name__ == '__main__':
    global_init("instance/users.db")
    app.run("0.0.0.0", debug=True)
