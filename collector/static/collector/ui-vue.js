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
	    SUCCESS: '<span style="color: green;" class="glyphicon glyphicon-ok"></span>'
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
            '<td><a v-on:click="click">Process</a></td>',
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
        			return HTML_STATUS.FAILURE(this.file.error.statusText);
        		}
        		if (this.file.jsondata) {
        			return HTML_STATUS.SUCCESS;
        		}
        		return '';
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
            }
        },
        template: [
            '<table class="table table-responsive table-striped filelist-container">',
            '<thead>',
            '<th></th>',
            '<th>Id</th>',
            '<th>Name</th>',
            '<th>Size</th>',
            '<th colspan="2">Processed</th>',
            '</thead>',
            '<tbody>',
            '<file-item v-for="file in files" v-bind:file="file" v-bind:actions="actions"></file-item>',
            '</tbody>',
            '</table>'
        ].join("")
    });

    function processFile(file, app) {
    	var args = {};
    	args[file.id] = 'on';
    	args.csrfmiddlewaretoken = getCSRFToken();

        $.post('process_files', args).done(function(jsonRes) {
        	file.progress = false;
        }).fail(function(res) {
        	file.progress = false;
        	file.error = res;
        });
    }

    var app = new Vue({
        el: '#filelist',
        template: '<file-list v-bind:files="files" v-bind:actions="actions"></file-list>',
        data: {
            files: [],
            actions: {
            	process: function(id) {
            		app.files.forEach(function(file) {
            			if (file.id === id) {
            				file.progress = true;
            				file.error = '';
            				processFile(file, app);
            			}
            		});
            	}
            }
        },
        methods: {}
    });

    refreshFileList(function(files) {
    	/*
    	files.forEach(function(file) {
    		app.states[file.id] = '';
    	});
    	*/	
    	app.files = files.map(function(file) {
    		file.error = '';
    		file.progress = false;
    		return file;
    	});
    });

    window.app = app;



}());