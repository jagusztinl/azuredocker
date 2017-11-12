(function() {
    console.log('ui-vue.js loaded');

    function getCSRFToken() {
        return $('[name=csrfmiddlewaretoken]')[0].value;
    }

    /**
     * Because lodash remove() doesn't trigger
     * any updates.
     */
    function removeOne(arr, fn) {
        var i = 0;
        for(i=0;i<arr.length;i++) {
            if (fn(arr[i])) {
                arr.splice(i, 1);
                return;
            }
        }
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
            loading: {
                type: Boolean,
                default: false
            }
        },
        methods: {
            checkAll: function() {
                var checked = !this.allChecked;
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
                    if (!this.files[i].viewState.checked) {
                        return false;
                    }
                }
                return true;
            },
            tableClass: function() {
                var base = "table table-responsive table-hover filelist-container ";
                if (this.loading) {
                    return base + "loading";
                }
                return base + "table-striped";

            },
        },
        template: [
            '<table v-bind:class="tableClass">',
            '<thead>',
            '<tr>',
            '<th><input class="filelist_checkbox" v-on:click="checkAll" type="checkbox" v-bind:checked="allChecked"></th>',
            '<th>Id</th>',
            '<th>Name</th>',
            '<th>Uploaded</th>',
            '<th>Size</th>',
            '<th colspan="2">Processed</th>',
            '</tr>',
            '</thead>',
            '<tbody>',
            '<file-item v-for="file in files" v-bind:file="file.file" :key="file.id" v-bind:viewState="file.viewState" v-bind:actions="actions"></file-item>',
            '</tbody>',
            '</table>'
        ].join("")
    });

    function processFile(file, app) {

    }

    var app = new Vue({
        el: '#filelist',
        template: [
            '<div>',
            '<div style="position: fixed;" role="group" aria-label="Basic example">',
            '<button type="button" class="btn btn-primary" v-bind:disabled="!haveSelection" v-on:click="deleteSelected">Delete Selected</button>',
            '<button type="button" class="btn btn-primary" v-bind:disabled="loading" v-on:click="reload">Reload</button>',
//            '<button type="button" class="btn btn-primary">Middle</button>',
//            '<button type="button" class="btn btn-primary">Right</button>',
            '</div>',
            '<div style="height: 40px;">&nbsp;</div>',
            '<file-list v-bind:files="files" v-bind:actions="actions" v-bind:viewState="viewState" v-bind:loading="loading"></file-list>',
            '</div>'
        ].join("\n"),
        data: {
            files: [],
            tasks: {},
            actions: {
            	process: function(id) {
                    app.process(id);
            	}
            },
            pollInterval: 2000,
            viewState: {},
            deleteQueue: [],
            deleteCurrent: null,
            loading: false
        },
        created: function() {
            this.reload();
        },
        mounted: function() {
            this.pollTasks();
        },
        destroyed: function() {
            // stop polling

        },
        computed: {
            haveSelection: function() {
                var i, files;
                files = this.files;
                if (!files) {
                    return false;
                }
                for(i=0;i<files.length;i++) {
                    if (files[i].viewState.checked) {
                        return true;
                    }
                }
                return false;
            }
        },
        methods: {
            deleteSelected: function() {
                this.getSelectedIds().forEach(function(id) {
                    if (this.deleteQueue.indexOf(id) === -1) {
                        this.deleteQueue.push(id);
                    }
                }.bind(this));
            },
            getSelectedIds: function() {
                return this.files.filter(function(item) {
                    return item.viewState.checked;
                }).map(function(item) {
                    return item.file.id;
                });
            },
            refreshFileList: function(callback) {
                return $.getJSON('/API/files/');
            },
            reload: function() {
                if (this.loading) {
                    return;
                }
                this.loading = true;
                this.refreshFileList().then(function(files) {
                    app.files = files.map(function(file) {
                        return {
                            file: file,
                            viewState: {
                                progress: false,
                                expanded: false,
                                checked: false
                            }
                        };
                    });
                }).always(function() {
                    this.loading = false;
                }.bind(this));
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
                    $.getJSON('/API/tasks/?filter=' + task_ids.join(",")).done(function(res) {
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
            deleteNext: function() {
                var me = this;
                if (this.deleteQueue.length === 0) {
                    return;
                }
                if (!this.deleteCurrent) {
                    this.deleteCurrent = this.deleteQueue.shift();
                    if (!this.deleteCurrent) {
                        return;
                    }
                    $.ajax({
                        url: "/API/files/" + this.deleteCurrent, 
                        type: 'DELETE',
                        headers: {'X-CSRFTOKEN': getCSRFToken()},
                    }).done(function(res) {
                        removeOne(this.files, function(item) {
                            return item.file.id === me.deleteCurrent;
                        });
                        this.deleteCurrent =  null;
                        this.deleteNext();
                    }.bind(this)).fail(function(res) {
                        // put it last. try again later
                        console.log("Failed deleting " + this.deleteCurrent + ", trying again later");
//                        this.deleteQueue.push(this.deleteCurrent);
                        this.deleteCurrent = null;
                        this.deleteNext();
                    }.bind(this));
                }
            }
        },
        watch: {
            deleteQueue: function(queue) {
                console.log("deleteQueue", queue);
                this.deleteNext();
            }
        }
    });


    window.app = app;



}());