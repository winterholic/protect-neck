# -*- coding: utf-8 -*-
from PyQt5.QtWidgets import QWidget, QVBoxLayout, QLabel, QPushButton
from PyQt5.QtCore import Qt, pyqtSignal

class ChoiceWidget(QWidget):
    skip_clicked = pyqtSignal()
    stretch_clicked = pyqtSignal()
    break_clicked = pyqtSignal()

    def __init__(self):
        super().__init__()
        self.setup_ui()

    def setup_ui(self):
        layout = QVBoxLayout(self)
        layout.setAlignment(Qt.AlignCenter)
        layout.setSpacing(20)

        message = QLabel('30분이 지났습니다!')
        message.setObjectName('choiceMessage')
        message.setAlignment(Qt.AlignCenter)
        layout.addWidget(message)

        skip_btn = QPushButton('나중에 하기')
        skip_btn.setObjectName('skipButton')
        skip_btn.clicked.connect(self.skip_clicked.emit)
        layout.addWidget(skip_btn)

        stretch_btn = QPushButton('스트레칭 시작')
        stretch_btn.setObjectName('stretchButton')
        stretch_btn.clicked.connect(self.stretch_clicked.emit)
        layout.addWidget(stretch_btn)

        break_btn = QPushButton('화장실/산책')
        break_btn.setObjectName('breakButton')
        break_btn.clicked.connect(self.break_clicked.emit)
        layout.addWidget(break_btn)
