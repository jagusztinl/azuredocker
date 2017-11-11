(function() {
    console.log('ui-vue.js loaded');

    function getCSRFToken() {
        return $('[name=csrfmiddlewaretoken]')[0].value;
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
        props: ['file', 'viewState', 'actions'],
        template: [
            '<tr v-bind:class="trClass">',
                '<td><input class="filelist_checkbox" v-on:click="check" type="checkbox" v-bind:checked="viewState.checked"></input></td>',
                '<td>{{ file.id }}</td>',
                '<td>{{ file.name }}',
                    '<div v-if="viewState.expanded">',
                        '<div class="bg-warning" v-if="file.error"><span style="font-weight: bold">Error: </span>{{ file.error }}</div>',
                    '</div>',
                '</td>',
                '<td>{{ uploadedFromNow }}</td>',
                '<td>{{ file.size }}</td>',
                '<td v-html="htmlStatus"></td>',
                '<td>',
                    '<span v-if="viewState.progress">...</span>',
                    '<span v-if="file.jsondata">&nbsp;</span>',
                    '<a style="cursor: hand;" v-if="!viewState.progress && !file.jsondata" v-on:click="click">Process</a>',
                '</td>',
            '</tr>'
        ].join(""),
        methods: {
        	click: function() {
        		this.actions.process(this.file.id);
        	},
            check: function() {
                this.viewState.checked = !this.viewState.checked;
            }
        },
        computed: {
            trClass: function() {
                if (this.viewState.checked) {
                    return "info";
                }
                return "";

            },
        	htmlStatus: function() {
                if (this.viewState.progress) {
                    return HTML_STATUS.PROGRESS;
                }
        		if (this.file.error) {
        			return HTML_STATUS.FAILURE(this.file.error);
        		}
        		if (this.file.jsondata) {
        			return HTML_STATUS.SUCCESS;
        		}
                return HTML_STATUS.PENDING;
        	},
            uploadedFromNow: function() {
                return moment(this.file.created_at).fromNow();
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
            },
            viewState: {
                allChecked: {
                    type: Boolean,
                    default: false
                }
            }
        },
        methods: {
            checkAll: function() {
                var checked = this.viewState.checked = !this.viewState.checked;
                this.files.forEach(function(item) {
                    item.viewState.checked = checked;

                });

            }
        },
        computed: {
            allChecked: function() {
                var i;
                if (this.files.length === 0) {
                    return false;
                }
                for(i=0;i<this.files.length;i++) {
                    if (!this.files.viewState.checked) {
                        return false;
                    }
                }
                return true;
            }
        },
        template: [
            '<table class="table table-responsive table-hover table-striped filelist-container">',
            '<thead>',
            '<tr>',
            '<th><input class="filelist_checkbox" v-on:click="checkAll" type="checkbox" v-bind:checked="viewState.allChecked"></th>',
            '<th>Id</th>',
            '<th>Name</th>',
            '<th>Uploaded</th>',
            '<th>Size</th>',
            '<th colspan="2">Processed</th>',
            '</thead>',
            '</tr>',
            '<tbody>',
            '<file-item v-for="file in files" v-bind:file="file.file" v-bind:viewState="file.viewState" v-bind:actions="actions"></file-item>',
            '<tr v-if="files.length === 0">',
            '<td colspan="7">Loading...</td>',
            '</tr>',
            '</tbody>',
            '</table>'
        ].join("")
    });

    function processFile(file, app) {

    }

    var app = new Vue({
        el: '#filelist',
        template: '<file-list v-bind:tasks="tasks" v-bind:files="files" v-bind:actions="actions" v-bind:viewState="viewState"></file-list>',
        data: {
            files: [],
            tasks: {},
            actions: {
            	process: function(id) {
                    app.process(id);
            	}
            },
            pollInterval: 2000,
            viewState: {}
        },
        created: function() {
            this.refreshFileList(function(files) {
                app.files = files.map(function(file) {
                    return {
                        file: file,
                        viewState: {
                            progress: false,
                            expanded: file.id == 15,
                            checked: false
                        }
                    };
                });
            });
        },
        mounted: function() {
            this.pollTasks();
        },
        destroyed: function() {
            // stop polling

        },
        methods: {
            refreshFileList: function(callback) {
                $.getJSON('/API/files/', function(ret) {
                    callback(ret);
                });
            },
            process: function(id) {
                this.files.forEach(function(item) {
                    var file = item.file, viewState = item.viewState;
                    if (file.id === id) {
                        var args = {};
                        args[file.id] = 'on';
                        args.csrfmiddlewaretoken = getCSRFToken();

                        $.post('process_files', args).done(function(jsonRes) {
                            console.log(jsonRes);
                            jsonRes.results.forEach(function(task) {
                                app.tasks[task.task_id] = task;
                            });
                        }).fail(function(res) {
                            viewState.progress = false;
                            file.error = res;
                        });
                        viewState.progress = true;
                    }
                });
            },
            pollTasks: function() {
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
                    me.files.forEach(function(item) {
                        newFile = fileDict[item.file.id];
                        if (newFile) {
                            item.file = newFile;
                        }
                        item.viewState.progress = false;
                    });
                });
            },
        }
    });


    window.app = app;



}());