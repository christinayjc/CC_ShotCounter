function ShotCounter() {
    const storyboard = new StoryboardManager();

    // MessageLog.clearLog();

    function getParentWidget() {
        var topWidgets = QApplication.topLevelWidgets();
        for (var i in topWidgets) {
            if (topWidgets[i] instanceof QMainWindow && !topWidgets[i].parentWidget()) {
                return topWidgets[i];
            }
        }

        return "";
    }

    function getIcon(filename) {
        var icon = specialFolders.resource + '/icons/' + filename;
        return icon;
    }

    function getProjectFilename() {
		var recentScenes = preferences.getString('RECENT_SCENES_LIST', '');

		if (recentScenes) {
			var firstScene = recentScenes.split("$")[0]; 
			var firstSceneFilename = firstScene.split("/").pop().replace('.sbpz', ''); 
			
			return firstSceneFilename

		} else {
			MessageLog.debug('No recent scenes found.');
		}
	}

    function parseFileName(baseNameLower) {
		var fileNameSplit = baseNameLower.split('_');
		var seasonLower = fileNameSplit[0];
		var episode = fileNameSplit[1];
		var sequenceLower = fileNameSplit[2];
		var version = fileNameSplit[3];
		var date = fileNameSplit[4];
	
		return {
			season : seasonLower.toUpperCase(),
			episode: episode,
			sequence: sequenceLower.toUpperCase(),
			version: version,
			date: date
		};
	}

    function getSceneData() {
        var sceneNames = [];
    
        var sequenceId = storyboard.sequenceInProject(0);
		var nameOfSequenceInSBP = storyboard.nameOfSequence(sequenceId);
        var numberOfScenesInProject = storyboard.numberOfScenesInProject();

        for (var i = 0; i < numberOfScenesInProject; i++) {
			var sceneId = storyboard.sceneInProject(i);

            var sceneName = storyboard.nameOfScene(sceneId);
            sceneNames.push(sceneName);
        }

        // MessageLog.trace(sceneNames);

        var projectFileName = getProjectFilename();
        var baseNameLower = projectFileName.toLowerCase();
        var parsed = parseFileName(baseNameLower);

        return {
            episode: parsed.episode,
            sequence: nameOfSequenceInSBP,
            shots: sceneNames,
            numberOfShots: numberOfScenesInProject
        }
    } 

    function ShotCounterDialog() {
        var self = this;
        var data = getSceneData();
        var copyData = '';
        var headerLabels = ['Episode', 'Sequence', 'Shot Code'];
        
        _init_ui();
        _connect_ui();
        _load_settings();

        function _init_ui() {
            self.dialog = new QDialog();
            self.dialog.setWindowTitle('Shot Counter');
            self.dialog.modal = true;
            self.dialog.setMinimumSize(410, 350);

            var mainLayout = new QVBoxLayout(self.widget);
            self.dialog.setLayout(mainLayout);
    
            self.table = new QTableWidget(data.numberOfShots, headerLabels.length, self.dialog);
            self.table.setHorizontalHeaderLabels(headerLabels);
            self.table.setColumnWidth(0, 80);
            self.table.setColumnWidth(1, 100);
            self.table.setColumnWidth(2, 150);
    
            for (var i = 0; i < data.numberOfShots; i++) {
                var sequenceName = data.episode + '_' + data.sequence;
                var shotCode = data.episode + '_' + data.sequence + '_' + data.shots[i];
    
                self.table.setItem(i, 0, new QTableWidgetItem(data.episode));
                self.table.setItem(i, 1, new QTableWidgetItem(sequenceName));
                self.table.setItem(i, 2, new QTableWidgetItem(shotCode));

                copyData += data.episode + '\t' + sequenceName + '\t' + shotCode
                copyData += '\n';
            }

            var checkboxCopyButtonLayout = new QHBoxLayout();
            self.headerCheckbox = new QCheckBox('Copy with Header');
            self.copyButton = new QToolButton();
            self.copyButton.icon = new QIcon(getIcon('edit/copy.svg'));
            self.copyButton.setIconSize(new QSize(25,25));
            self.copyButton.toolTip = 'Copy to Clipboard';

            checkboxCopyButtonLayout.addWidget(self.headerCheckbox, 0, 0);
            checkboxCopyButtonLayout.addWidget(self.copyButton, 0, 0);

            self.closeButton = new QPushButton('Close');

            mainLayout.addWidget(self.table, 0, 0);
            mainLayout.addLayout(checkboxCopyButtonLayout);
            mainLayout.addWidget(self.closeButton, 0, 0);

            self.timer = new QTimer(self.dialog);
            self.timer.setSingleShot = true;

            self.dialog.show();
        }

        function _connect_ui() {
            self.closeButton.clicked.connect(self.dialog.close);
            self.copyButton.clicked.connect(self, copyText);
            self.headerCheckbox.toggled.connect(self, saveSetting);
            self.timer.timeout.connect(self, resetCopyButton);         
        }

        function _load_settings(){
            var checkboxPreference = preferences.getBool('CC_SHOT_COUNTER_CHECKBOX', false);
            self.headerCheckbox.checked = checkboxPreference;
        }

        function saveSetting(checked) {
            preferences.setBool('CC_SHOT_COUNTER_CHECKBOX', checked);
        }

        function copyText() {
            if (self.headerCheckbox.checked == true) {
                var headerLabelsCopy = '';
                
                for (var i = 0; i < headerLabels.length; i++) {
                    if (i == headerLabels.length - 1) {
                        headerLabelsCopy += headerLabels[i];
                    } else {
                        headerLabelsCopy += headerLabels[i] + '\t';
                    }
                }

                var copyDataWithHeader = headerLabelsCopy + '\n' + copyData;
                QApplication.clipboard().setText(copyDataWithHeader);

            } else {
                QApplication.clipboard().setText(copyData);
            }

            self.copyButton.icon = new QIcon(getIcon('UI/menu_check_2x.png'));
            self.timer.start(2000);
        }

        function resetCopyButton() {
            self.copyButton.icon = new QIcon(getIcon('edit/copy.svg'));
        }
        
    }
    
    var parentWidget = getParentWidget();
    new ShotCounterDialog(parentWidget);
}
