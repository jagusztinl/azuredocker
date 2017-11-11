(function() {
    console.log('ui-vue.js loaded');

    function getCSRFToken() {
        return $('[name=csrfmiddlewaretoken]')[0].value;
    }


    function refreshFileList(callback) {
        $.getJSON('/API/files/', function(ret) {
            callback(ret);
        });
    }


    var HTML_STATUS = {
	    FAILURE: function(error) {
	    	var span = document.createElement('span');
	    	span.style = "color: red";
	    	span.className = "glyphicon glyphicon-alert";
	    	span.title = error;
	    	return span.outerHTML;
	    },
	    PROGRESS: '<span class="glyphicon glyphicon-refresh spinner"></span>',
	    SUCCESS: '<span style="color: green;" class="glyphicon glyphicon-ok"></span>',
        PENDING: '<span style="font-weight: bold">&nbsp;</span>'
	};

    Vue.component('file-item', {
        props: ['file', 'actions'],
        template: [
            '<tr>',
            '<td><input class="filelist_checkbox" type="checkbox" name="{{ file.id }}" data-id="{{ id }}"></input></td>',
            '<td>{{ file.id }}</td>',
            '<td>{{ file.name }}</td>',
            '<td>{{ file.size }}</td>',
            '<td v-html="htmlStatus"></td>',
            '<td>',
                '<span v-if="file.progress">...</span>',
                '<span v-if="file.jsondata">&nbsp;</span>',
                '<a style="cursor: hand;" v-if="!file.progress && !file.jsondata" v-on:click="click">Process</a>',
            '</td>',
            '</tr>'
        ].join(""),
        methods: {
        	click: function() {
        		this.actions.process(this.file.id);
        	}
        },
        computed: {
        	htmlStatus: function() {
                if (this.file.progress) {
                    return HTML_STATUS.PROGRESS;
                }
        		if (this.file.error) {
        			return HTML_STATUS.FAILURE(this.file.error);
        		}
        		if (this.file.jsondata) {
        			return HTML_STATUS.SUCCESS;
        		}
                return HTML_STATUS.PENDING;
        	}
        }
    });

    Vue.component('file-list', {
        props: {
            files: {
                type: Array,
                default: []
            },
            actions: {
            	type: Object,
            	default: {
            		process: function(id) {
            			alert('Processing ' + id);
            		}

            	}
            },
            tasks: {
                type: Array
            }
        },
        template: [
            '<table class="table table-responsive table-striped filelist-container">',
            '<thead>',
            '<th></th>',
            '<th>Id</th>',
            '<th>Name</th>',
            '<th>Size</th>',
            '<th colspan="2">Processed (running: {{tasks.length}})</th>',
            '</thead>',
            '<tbody>',
            '<file-item v-for="file in files" v-bind:file="file" v-bind:actions="actions"></file-item>',
            '</tbody>',
            '</table>'
        ].join("")
    });

    function processFile(file, app) {

    }

    var app = new Vue({
        el: '#filelist',
        template: '<file-list v-bind:tasks="tasks" v-bind:files="files" v-bind:actions="actions"></file-list>',
        data: {
            files: [],
            tasks: {},
            actions: {
            	process: function(id) {
                    app.process(id);
            	}
            },
            pollInterval: 2000
        },
        methods: {
            process: function(id) {
                this.files.forEach(function(file) {
                    if (file.id === id) {
                        var args = {};
                        args[file.id] = 'on';
                        args.csrfmiddlewaretoken = getCSRFToken();

                        $.post('process_files', args).done(function(jsonRes) {
                            console.log(jsonRes);
                            jsonRes.results.forEach(function(task) {
                                app.tasks[task.task_id] = task;
                            });
                 //          file.progress = false;
                        }).fail(function(res) {
                            file.progress = false;
                            file.error = res;
                        });
                        file.progress = true;
                    }
                });
            },
            pollTasks: function() {
                console.log("pollTasks enter");
                var me = this,
                    task_ids = [], key;
                for(key in this.tasks) {
                    if(this.tasks.hasOwnProperty(key)) {
                        task = this.tasks[key];
                        task_ids.push(task.task_id);
                    }
                }
                if (task_ids.length > 0) {
                    $.get('/API/tasks/?filter=' + task_ids.join(",")).done(function(res) {
                        setTimeout(function() {
                            me.pollTasks();
                        }, me.pollInterval);
                        me.onUpdateTasks(res.status);
                    });
                    task_ids.join("");
                } else {
                    console.log("pollTasks no task ids");
                    setTimeout(function() {
                        me.pollTasks();
                    }, this.pollInterval);
                }

            },
            onUpdateTasks: function(statusDict) {
                var me = this, status, id, clearIds = [];
                for(id in statusDict) {
                    if (statusDict.hasOwnProperty(id)) {
                        status = statusDict[id];
                        if (status !== "PENDING") {
                            task = me.tasks[id];
                            clearIds.push(task.id);
                            delete me.tasks[id];
                        }
                    }
                }
                me.updateFiles(clearIds);
            },
            updateFiles: function(fileIds) {
                var me = this;
                $.get('/API/files/?filter=' + fileIds.join(",")).done(function(res) {
                    var fileDict = {};
                    res.forEach(function(file) {
                        fileDict[file.id] = file;
                    });
                    me.files.forEach(function(file) {
                        newFile = fileDict[file.id];
                        if (newFile) {
                            ['jsondata', 'error'].forEach(function(key) {
                                if (newFile.hasOwnProperty(key)) {
                                    file[key] = newFile[key];
                                }
                            });
                        }
                        file.progress = false;
                    });
                });
            },
        },
        created: function() {
            this.pollTasks();
        },
        destroyed: function() {

        }

    });

    refreshFileList(function(files) {
    	/*
    	files.forEach(function(file) {
    		app.states[file.id] = '';
    	});
    	*/
    	app.files = files.map(function(file) {
    		file.progress = false;
    		return file;
    	});
    });

    window.app = app;



}());