# -*- coding: utf-8 -*-
from PyQt5.QtWidgets import QWidget, QVBoxLayout, QLabel, QPushButton
from PyQt5.QtCore import Qt, pyqtSignal
from core.timer import TimerController

class TimerWidget(QWidget):
    timer_finished = pyqtSignal()

    def __init__(self):
        super().__init__()
        self.setup_ui()

        self.timer = TimerController(duration=1800)  # 30 minutes
        self.timer.tick.connect(self.update_display)
        self.timer.finished.connect(self.on_timer_finished)

    def setup_ui(self):
        layout = QVBoxLayout(self)
        layout.setAlignment(Qt.AlignCenter)

        self.time_label = QLabel('30:00')
        self.time_label.setObjectName('timerDisplay')
        self.time_label.setAlignment(Qt.AlignCenter)
        layout.addWidget(self.time_label)

        self.play_pause_btn = QPushButton('시작하기')
        self.play_pause_btn.setObjectName('playPauseButton')
        self.play_pause_btn.clicked.connect(self.toggle_timer)
        layout.addWidget(self.play_pause_btn)

    def toggle_timer(self):
        if self.timer.is_running:
            self.timer.pause()
            self.play_pause_btn.setText('재생')
        else:
            self.timer.start()
            self.play_pause_btn.setText('일시정지')

    def update_display(self, remaining):
        minutes = remaining // 60
        seconds = remaining % 60
        self.time_label.setText(f'{minutes:02d}:{seconds:02d}')

    def on_timer_finished(self):
        self.timer_finished.emit()
