(function() {
    var htmlError = '<span style="color: red;" class="glyphicon glyphicon-alert"></span>';
    var htmlProgress = '<span class="glyphicon glyphicon-refresh spinner"></span>';
    var htmlSuccess = '<span style="color: green;" class="glyphicon glyphicon-ok"></span>';

    function getCSRFToken() {
        return $('[name=csrfmiddlewaretoken]')[0].value;
    }

    var tpl = Handlebars.compile(document.getElementById('filelist_template').innerHTML);
    Handlebars.registerPartial('filelist_row', document.getElementById('filelist_row_template').innerHTML);

    function renderFileList(data) {
        var html = tpl({
            files: data
        });
        $('#filelist_container').html(html);
        afterRender();
    }

    function refreshFileList() {
	    $.getJSON('/API/files/', function(ret) {
	        renderFileList(ret);
	    });
	}

	refreshFileList();

    function doDelete(id) {
        return $.ajax({
            url: 'API/files/' + id,
            method: 'DELETE',
            dataType: 'json'
        });

    }

    function deleteSelected() {
    	var ids = [], calls;
        $(".filelist_checkbox:checked").each(function(idx, el) {
        	ids.push(el.getAttribute('data-id'));
        });
       	calls = ids.map(function(id) {
	        return doDelete(id);
       	});
        $.when.apply($, calls).then(function() {
        	refreshFileList();
        }, function() {
        	alert('failed!');
        });

//                    confirm('Really delete?');
    }

    $("#deleteButton").click(deleteSelected);

    function afterRender() {
        $(".file_status").each(function(idx, el) {
            var $el = $(el),
                status = Number(el.getAttribute('data-orig-status'));
            if (status) {
                $el.html(htmlSuccess);
            }
        });


        $(".process_button").click(function(event) {
            var fileId = event.target.getAttribute('data-id');
            var args = {};
            args[fileId] = 'on';
            args.csrfmiddlewaretoken = getCSRFToken();
            $('#status_' + fileId).html(htmlProgress);

            $.post('process_files', args).done(function(jsonRes) {
                if (jsonRes.success) {
                    jsonRes.results.forEach(function(entry) {
                        $('#status_' + entry.id).html(entry.success ? htmlSuccess : htmlFailure);
                    });
                } else {
                    alert('error, got json response!');
                }

            }).fail(function(res) {
                var $error = $(htmlError);
                $error.attr('title', res.responseText);
                $('#status_' + fileId).html($error);
            });
        });
    }

}());
