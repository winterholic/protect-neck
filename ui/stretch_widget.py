# -*- coding: utf-8 -*-
from PyQt5.QtWidgets import QWidget, QVBoxLayout, QLabel
from PyQt5.QtCore import Qt, QTimer, pyqtSignal
from PyQt5.QtGui import QPixmap
from core.sequence import STRETCH_SEQUENCE
from utils import resource_path

class StretchWidget(QWidget):
    sequence_finished = pyqtSignal()

    def __init__(self):
        super().__init__()
        self.current_step = 0
        self.step_remaining = 0
        self.setup_ui()

        self.step_timer = QTimer()
        self.step_timer.timeout.connect(self.on_step_tick)
        self.step_timer.setInterval(1000)

    def setup_ui(self):
        layout = QVBoxLayout(self)
        layout.setAlignment(Qt.AlignCenter)
        layout.setSpacing(20)

        self.image_label = QLabel()
        self.image_label.setObjectName('stretchImage')
        layout.addWidget(self.image_label, alignment=Qt.AlignCenter)

        self.timer_label = QLabel('00:00')
        self.timer_label.setObjectName('stretchTimer')
        self.timer_label.setAlignment(Qt.AlignCenter)
        layout.addWidget(self.timer_label)

        self.message_label = QLabel()
        self.message_label.setObjectName('stretchMessage')
        self.message_label.setAlignment(Qt.AlignCenter)
        self.message_label.setWordWrap(True)
        layout.addWidget(self.message_label)

    def start_sequence(self):
        self.current_step = 0
        self.load_current_step()
        self.step_timer.start()

    def load_current_step(self):
        if self.current_step >= len(STRETCH_SEQUENCE):
            self.step_timer.stop()
            self.sequence_finished.emit()
            return

        step = STRETCH_SEQUENCE[self.current_step]
        self.step_remaining = step['duration']

        image_path = resource_path(f"resources/images/{step['image']}")
        pixmap = QPixmap(image_path)
        if not pixmap.isNull():
            self.image_label.setPixmap(pixmap.scaled(600, 400, Qt.KeepAspectRatio, Qt.SmoothTransformation))
        else:
            self.image_label.setText('Image not found')

        self.message_label.setText(step['message'])
        self.update_timer_display()

    def on_step_tick(self):
        self.step_remaining -= 1
        self.update_timer_display()

        if self.step_remaining <= 0:
            self.current_step += 1
            self.load_current_step()

    def update_timer_display(self):
        minutes = self.step_remaining // 60
        seconds = self.step_remaining % 60
        self.timer_label.setText(f'{minutes:02d}:{seconds:02d}')
