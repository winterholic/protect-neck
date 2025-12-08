# -*- coding: utf-8 -*-
from PyQt5.QtCore import QObject, QTimer, pyqtSignal

class TimerController(QObject):
    """Timer Controller"""

    tick = pyqtSignal(int)
    finished = pyqtSignal()

    def __init__(self, duration=1800):  # Default 30 minutes
        super().__init__()
        self.duration = duration
        self.remaining = duration
        self.is_running = False

        self.timer = QTimer()
        self.timer.timeout.connect(self._on_tick)
        self.timer.setInterval(1000)

    def start(self):
        if not self.is_running:
            self.is_running = True
            self.timer.start()

    def pause(self):
        if self.is_running:
            self.is_running = False
            self.timer.stop()

    def reset(self):
        self.timer.stop()
        self.is_running = False
        self.remaining = self.duration
        self.tick.emit(self.remaining)

    def _on_tick(self):
        self.remaining -= 1
        self.tick.emit(self.remaining)

        if self.remaining <= 0:
            self.timer.stop()
            self.is_running = False
            self.finished.emit()

    def get_remaining_time(self):
        return self.remaining
