# -*- coding: utf-8 -*-
from PyQt5.QtWidgets import QWidget, QVBoxLayout, QLabel, QPushButton
from PyQt5.QtCore import Qt, QTimer, pyqtSignal
from PyQt5.QtGui import QPixmap
from utils import resource_path

class BreakWidget(QWidget):
    return_clicked = pyqtSignal()

    def __init__(self):
        super().__init__()
        self.elapsed_seconds = 0
        self.setup_ui()

        self.elapsed_timer = QTimer()
        self.elapsed_timer.timeout.connect(self.update_elapsed)
        self.elapsed_timer.setInterval(1000)

    def setup_ui(self):
        layout = QVBoxLayout(self)
        layout.setAlignment(Qt.AlignCenter)
        layout.setSpacing(20)

        self.image_label = QLabel()
        self.image_label.setObjectName('breakImage')
        image_path = resource_path('resources/images/break_walk.png')
        pixmap = QPixmap(image_path)
        if not pixmap.isNull():
            self.image_label.setPixmap(pixmap.scaled(600, 400, Qt.KeepAspectRatio, Qt.SmoothTransformation))
        else:
            self.image_label.setText('Image not found')
        layout.addWidget(self.image_label, alignment=Qt.AlignCenter)

        self.elapsed_label = QLabel('00:00')
        self.elapsed_label.setObjectName('elapsedTimer')
        self.elapsed_label.setAlignment(Qt.AlignCenter)
        layout.addWidget(self.elapsed_label)

        return_btn = QPushButton('복귀하기')
        return_btn.setObjectName('returnButton')
        return_btn.clicked.connect(self.on_return_clicked)
        layout.addWidget(return_btn)

    def start(self):
        self.elapsed_seconds = 0
        self.elapsed_timer.start()
        self.update_elapsed()

    def update_elapsed(self):
        self.elapsed_seconds += 1
        minutes = self.elapsed_seconds // 60
        seconds = self.elapsed_seconds % 60
        self.elapsed_label.setText(f'{minutes:02d}:{seconds:02d}')

    def on_return_clicked(self):
        self.elapsed_timer.stop()
        self.return_clicked.emit()
