from flask_sqlalchemy import SQLAlchemy
from flask_login import UserMixin
import sqlalchemy as sa
import sqlalchemy.orm as orm
from sqlalchemy.orm import Session
import sqlalchemy.ext.declarative as dec

db = SQLAlchemy()
SqlAlchemyBase = dec.declarative_base()

class User(db.Model, UserMixin):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(50), unique=True, nullable=False)
    email = db.Column(db.String(100), unique=True, nullable=False)
    password_hash = db.Column(db.String(128), nullable=False)

class Music(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    file_path = db.Column(db.String(255), nullable=False)
    track_author = db.Column(db.String(100))
    track_title = db.Column(db.String(100))
    cover_path = db.Column(db.String(255), nullable=False, default='/static/covers/default.png')

    user = db.relationship('User', backref=db.backref('tracks', lazy=True))

    def __repr__(self):
        return f"{self.id} {self.user_id} {self.file_path} {self.track_title} {self.track_author} {self.cover_path}"


__factory = None
def global_init(db_file):
    global __factory

    if __factory:
        return

    if not db_file or not db_file.strip():
        raise Exception("Необходимо указать файл базы данных.")

    conn_str = f'sqlite:///{db_file.strip()}?check_same_thread=False'
    print(f"Подключение к базе данных по адресу {conn_str}")

    engine = sa.create_engine(conn_str, echo=False, pool_size=20, max_overflow=30)
    __factory = orm.sessionmaker(bind=engine)


    SqlAlchemyBase.metadata.create_all(engine)


def create_session() -> Session:
    global __factory
    return __factory()