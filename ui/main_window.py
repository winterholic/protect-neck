# -*- coding: utf-8 -*-
from PyQt5.QtWidgets import QMainWindow, QWidget, QVBoxLayout, QStackedWidget, QSystemTrayIcon, QMenu, QAction, QMessageBox
from PyQt5.QtCore import Qt
from PyQt5.QtGui import QIcon
from .timer_widget import TimerWidget
from .choice_widget import ChoiceWidget
from .break_widget import BreakWidget
from .stretch_widget import StretchWidget
from utils import resource_path

class MainWindow(QMainWindow):
    def __init__(self):
        super().__init__()
        self.setWindowTitle('목 건강 지킴이')
        self.setMinimumSize(800, 600)

        # Set window icon
        icon_path = resource_path('resources/images/icon.png')
        self.setWindowIcon(QIcon(icon_path))

        central_widget = QWidget()
        self.setCentralWidget(central_widget)

        layout = QVBoxLayout(central_widget)
        layout.setContentsMargins(0, 0, 0, 0)

        self.stacked_widget = QStackedWidget()
        layout.addWidget(self.stacked_widget)

        self.timer_widget = TimerWidget()
        self.stacked_widget.addWidget(self.timer_widget)

        self.choice_widget = ChoiceWidget()
        self.stacked_widget.addWidget(self.choice_widget)

        self.break_widget = BreakWidget()
        self.stacked_widget.addWidget(self.break_widget)

        self.stretch_widget = StretchWidget()
        self.stacked_widget.addWidget(self.stretch_widget)

        self.timer_widget.timer_finished.connect(self.show_choice_screen)
        self.choice_widget.skip_clicked.connect(self.on_skip)
        self.choice_widget.stretch_clicked.connect(self.on_stretch)
        self.choice_widget.break_clicked.connect(self.on_break)
        self.break_widget.return_clicked.connect(self.on_return)
        self.stretch_widget.sequence_finished.connect(self.on_stretch_finished)

        # Setup system tray
        self.setup_tray_icon()

    def setup_tray_icon(self):
        self.tray_icon = QSystemTrayIcon(self)
        icon_path = resource_path('resources/images/icon.png')
        self.tray_icon.setIcon(QIcon(icon_path))

        # Create tray menu
        tray_menu = QMenu()

        show_action = QAction('열기', self)
        show_action.triggered.connect(self.show_window)
        tray_menu.addAction(show_action)

        tray_menu.addSeparator()

        quit_action = QAction('종료', self)
        quit_action.triggered.connect(self.quit_application)
        tray_menu.addAction(quit_action)

        self.tray_icon.setContextMenu(tray_menu)
        self.tray_icon.activated.connect(self.on_tray_icon_activated)
        self.tray_icon.show()

        self.tray_icon.showMessage(
            '목 건강 지킴이',
            '백그라운드에서 실행 중입니다',
            QSystemTrayIcon.Information,
            2000
        )

    def on_tray_icon_activated(self, reason):
        if reason == QSystemTrayIcon.DoubleClick:
            self.show_window()

    def show_window(self):
        self.show()
        self.raise_()
        self.activateWindow()

    def closeEvent(self, event):
        event.ignore()
        self.hide()
        self.tray_icon.showMessage(
            '목 건강 지킴이',
            '트레이에서 실행 중입니다. 종료하려면 트레이 아이콘을 우클릭하세요.',
            QSystemTrayIcon.Information,
            2000
        )

    def quit_application(self):
        self.tray_icon.hide()
        QMainWindow.close(self)

    def show_choice_screen(self):
        self.stacked_widget.setCurrentIndex(1)
        self.show_window()
        self.tray_icon.showMessage(
            '목 건강 지킴이',
            '스트레칭 시간입니다!',
            QSystemTrayIcon.Information,
            3000
        )

    def on_skip(self):
        self.timer_widget.timer.reset()
        self.timer_widget.update_display(self.timer_widget.timer.remaining)
        self.timer_widget.timer.start()
        self.timer_widget.play_pause_btn.setText('일시정지')
        self.stacked_widget.setCurrentIndex(0)

    def on_stretch(self):
        self.stretch_widget.start_sequence()
        self.stacked_widget.setCurrentIndex(3)

    def on_break(self):
        self.break_widget.start()
        self.stacked_widget.setCurrentIndex(2)

    def on_return(self):
        self.timer_widget.timer.reset()
        self.timer_widget.update_display(self.timer_widget.timer.remaining)
        self.timer_widget.timer.start()
        self.timer_widget.play_pause_btn.setText('일시정지')
        self.stacked_widget.setCurrentIndex(0)

    def on_stretch_finished(self):
        self.timer_widget.timer.reset()
        self.timer_widget.update_display(self.timer_widget.timer.remaining)
        self.timer_widget.timer.start()
        self.timer_widget.play_pause_btn.setText('일시정지')
        self.stacked_widget.setCurrentIndex(0)
