'use strict';

angular.module('services', []);

/*
 * handle modal dialogs
 */
var cmtoolDialog = {

    alert: function(message) { this.showMessage("户型库审核后台", message, 'Ok'); },

    alertWithCallback: function(message, callBack) { this.showConfirmation("户型库审核后台", message, 'Ok', null, callBack, true); },

    // private function
    setDialogUi: function(title, message, primaryButtonText, dismissButtonText, primaryButtonCallback, hideDismissButton) {
        // set title
        $('#modal-common h4').text(title);
        $('#modal-common .modal-header').toggle(title ? true : false);
        // set message
        $('#modal-common .modal-body p').html(message);
        // set primary button text
        $('#modal-common .btn-primary').text(primaryButtonText ? primaryButtonText : '');
        // set dismiss button text
        $('#modal-common .btn-default').text(dismissButtonText ? dismissButtonText : 'Close');
        // toggle dismiss button
        $('#modal-common .btn-default').toggle(hideDismissButton ? false : true);
        // toggle primary button
        $('#modal-common .btn-primary').toggle(primaryButtonCallback ? true : false);
        // set primary button functionality
        $('#modal-common .btn-primary').unbind('click').click(primaryButtonCallback ? primaryButtonCallback : function() {});
    },

    showMessage: function(title, message, dismissButtonText) {
        this.setDialogUi(title, message, null, dismissButtonText, null);
        // show dialog
        $('#modal-common').modal('show');
    },

    showConfirmation: function(title, message, okText, cancelText, primaryButtonCallback, hideDismissButton) {
        this.setDialogUi(title, message, okText, cancelText, primaryButtonCallback, hideDismissButton);
        // show dialog
        $('#modal-common').modal('show');
    },

    dismissDialog: function() {
        $('#modal-common').modal('hide');
    }

};

var cmtoolCommon = {

    submitFilesForm: function(
        formSelector,
        progressSelector,
        submitUrl,
        onSuccess,
        onError,
        onBeforeSend,
        onProgressHandle) {
        var formData = new FormData($(formSelector)[0]);
        var xhr = $.ajax({
            url: cmtoolConsts.apiEndpoint + submitUrl,
            type: 'POST',
            xhr: function() { // Custom XMLHttpRequest
                var myXhr = $.ajaxSettings.xhr();
                if (myXhr.upload) { // Check if upload property exists
                    myXhr.upload.addEventListener('progress', onProgressHandle, false); // For handling the progress of the upload
                }
                return myXhr;
            },
            // Ajax events
            beforeSend: function(request) {
                var access_token = angular.injector(['ng', 'services']).get("StorageService").get("access_token");
                var $body = angular.element(document.body);
                var $rootScope = $body.scope().$root;
                request.setRequestHeader("Authorization", access_token);
                onBeforeSend();
            },
            success: onSuccess,
            error: onError,
            // Form data
            data: formData,
            // Options to tell jQuery not to process data or worry about content-type.
            cache: false,
            contentType: false,
            processData: false
        });

        return xhr;
    }
};
