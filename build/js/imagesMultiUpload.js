'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

/**
 * @todo setTimeout in {@link ImageUpload.prototype.trigger}
 */

/* eslint-disable */
if (!Array.prototype.find) {
  Array.prototype.find = function (predicate) {
    if (this == null) {
      throw new TypeError('Array.prototype.find called on null or undefined');
    }
    if (typeof predicate !== 'function') {
      throw new TypeError('predicate must be a function');
    }
    var list = Object(this);
    var length = list.length >>> 0;
    var thisArg = arguments[1];
    var value;

    for (var i = 0; i < length; i++) {
      value = list[i];
      if (predicate.call(thisArg, value, i, list)) {
        return value;
      }
    }
    return undefined;
  };
}

/* global define:true */
!function (factory) {
  if (typeof define === 'function' && define.amd) {
    // AMD. Register as an anonymous module.
    define(['jquery'], factory);
  } else if ((typeof module === 'undefined' ? 'undefined' : _typeof(module)) === 'object' && module.exports) {
    // Node/CommonJS
    module.exports = function (root, jQuery) {
      if (jQuery === undefined) {
        // require('jQuery') returns a factory that requires window to
        // build a jQuery instance, we normalize how we use modules
        // that require this pattern but the window provided is a noop
        // if it's defined (how jquery works)
        if (typeof window !== 'undefined') {
          jQuery = require('jquery');
        } else {
          jQuery = require('jquery')(root);
        }
      }
      return factory(jQuery);
    };
  } else {
    // Browser globals
    factory(window.jQuery);
  }
  /* eslint-enable */
}(function ($) {
  var POPUP_NAME = 'imagesMultiUpload.popup';

  var dropZone = '\n    <div class="fr-image-upload-layer fr-active fr-layer fp-image-upload-dropzone">\n      <strong>Drop image</strong><br>(or click)\n      <div class="fr-form">\n        <input type="file" multiple="" accept="image/jpeg, image/jpg, image/png, image/gif" \n            tabindex="-1" aria-labelledby="fr-image-upload-layer-1" role="button" dir="auto">\n      </div>\n    </div>';
  var multiUpload = '\n    <div class="multi-upload">\n    <div class="multi-upload__content"></div>\n    <div class="multi-upload__buttons">\n        <button class="multi-upload__btn multi-upload__insert-btn" disabled>Insert images</button>\n        <button class="multi-upload__btn multi-upload__cancel-btn">Cancel</button>\n    </div></div>';
  var dropTemplate = '<div class="images-multi-upload">' + dropZone + multiUpload + '</div>';

  var IMAGE_UPLOAD_STATUS_PENDING = 1;
  var IMAGE_UPLOAD_STATUS_SUCCESS = 2;
  var IMAGE_UPLOAD_STATUS_ERROR = 3;

  var ImageUpload = function () {
    function ImageUpload(options) {
      _classCallCheck(this, ImageUpload);

      this.$el = $('\n      <div class="upload-image">\n        <div class="upload-image__container">\n        <div class="upload-image__progressbar"><div class="upload-image__progressbar-line"></div></div>\n        <div class="upload-image__image"></div>\n        <button title="remove" class="upload-image__close-btn">x</button>\n        </div></div>');
      this.editor = options.editor;
      this.$image = this.$el.find('.upload-image__image');
      this.$closeBtn = this.$el.find('.upload-image__close-btn');
      this.$progressLine = this.$el.find('.upload-image__progressbar-line');
      this.image = options.file;
      this.url = null;
      this.status = 0;
      this.xhr = null;

      this.handleEvents();
    }

    _createClass(ImageUpload, [{
      key: 'handleEvents',
      value: function handleEvents() {
        this.$closeBtn.on('click', this.onRemove.bind(this));
      }
    }, {
      key: 'getStatus',
      value: function getStatus() {
        return this.status;
      }
    }, {
      key: 'abortXhr',
      value: function abortXhr() {
        this.xhr.abort();
        return this;
      }
    }, {
      key: 'startLoading',
      value: function startLoading() {
        this.$el.addClass('upload-image--loading');
      }
    }, {
      key: 'stopLoading',
      value: function stopLoading() {
        this.$el.removeClass('upload-image--loading');
      }
    }, {
      key: 'readImage',
      value: function readImage() {
        var _this = this;

        if (ImageUpload.isFileReaderAvailable()) {
          var reader = new FileReader();
          reader.addEventListener('load', function (event) {
            _this.renderImage(event.target.result);
          });
          reader.readAsDataURL(this.image);
        }
      }
    }, {
      key: 'changeProgress',
      value: function changeProgress(progress) {
        this.$progressLine.css({ width: progress + '%' });
      }
    }, {
      key: 'renderImage',
      value: function renderImage(url) {
        this.renderUrl = url;
        this.$image.css({ backgroundImage: 'url(' + url + ')' });
      }
    }, {
      key: 'getUrl',
      value: function getUrl() {
        return this.url;
      }
    }, {
      key: 'error',
      value: function error() {
        this.$el.addClass('image-upload--error');
        this.setStatus(IMAGE_UPLOAD_STATUS_ERROR);
      }
    }, {
      key: 'upload',
      value: function upload() {
        var _this2 = this;

        if (!this.image) {
          console.error('Property `image` must be set');
          return;
        }
        this.readImage();
        this.setStatus(IMAGE_UPLOAD_STATUS_PENDING);
        this.startLoading();

        var formData = new FormData();
        formData.append(this.editor.opts.imageUploadParam, this.image, this.image.name);
        Object.keys(this.editor.opts.imageUploadParams).forEach(function (uploadParam) {
          formData.append(uploadParam, _this2.editor.opts.imageUploadParams[uploadParam]);
        });

        this.xhr = $.ajax({
          url: this.editor.opts.imageUploadURL,
          type: 'POST',
          data: formData,
          processData: false,
          contentType: false,
          context: this,
          success: function success(data) {
            var response = data;
            if (typeof response === 'string') {
              response = JSON.parse(response);
            }
            if (!response.link) {
              _this2.error();
            }
            if (!ImageUpload.isFileReaderAvailable()) {
              _this2.renderImage(response.link);
            }
            _this2.url = response.link;
            _this2.setStatus(IMAGE_UPLOAD_STATUS_SUCCESS);
          },
          error: function error() {
            _this2.error();
          },
          complete: function complete() {
            _this2.stopLoading();
          },
          xhr: function xhr() {
            var xhr = new XMLHttpRequest();
            xhr.upload.addEventListener('progress', function (evt) {
              if (evt.lengthComputable) {
                var percentComplete = evt.loaded / evt.total;
                percentComplete = parseInt(percentComplete * 100, 10);
                _this2.changeProgress(percentComplete);
              }
            }, false);
            return xhr;
          }
        });
      }
    }, {
      key: 'setStatus',
      value: function setStatus(status) {
        this.status = status;
        this.trigger('changeStatus', status);
      }
    }, {
      key: 'render',
      value: function render() {
        return this.$el;
      }
    }, {
      key: 'onRemove',
      value: function onRemove(event) {
        event.preventDefault();
        this.trigger('imageRemove', this);
      }
    }, {
      key: 'remove',
      value: function remove() {
        this.abortXhr();
        this.$el.remove();
      }
    }, {
      key: 'trigger',
      value: function trigger(eventName, data) {
        var _this3 = this;

        setTimeout(function () {
          _this3.$el.triggerHandler(eventName, data);
        }, 0);
      }
    }, {
      key: 'on',
      value: function on(event, handler) {
        this.$el.on(event, handler);
      }
    }], [{
      key: 'isFileReaderAvailable',
      value: function isFileReaderAvailable() {
        return window.File && window.FileReader && window.FileList && window.Blob;
      }
    }]);

    return ImageUpload;
  }();

  var ImageInsert = function () {
    function ImageInsert($img, editor) {
      _classCallCheck(this, ImageInsert);

      this.editor = editor;
      this.$el = $img;

      this.$el.addClass('image-insert');

      this.init();
    }

    _createClass(ImageInsert, [{
      key: 'init',
      value: function init() {
        var _this4 = this;

        var image = new Image();
        image.src = this.$el.data('uploaded_url');
        this.$el.addClass('image-insert--loading').attr('title', this.editor.language.translate('Loading image'));
        image.onload = function () {
          _this4.$el.removeClass('image-insert--loading').attr({ src: image.src, title: '' });
        };
        image.onerror = function () {
          _this4.$el.removeClass('image-insert--loading').addClass('image-insert--error');
        };
      }
    }]);

    return ImageInsert;
  }();

  var ImagesUpload = function () {
    function ImagesUpload(options) {
      _classCallCheck(this, ImagesUpload);

      this.$el = $(options.el);
      this.$content = this.$el.find('.multi-upload__content');
      this.$insertButton = this.$el.find('.multi-upload__insert-btn');
      this.$cancelButton = this.$el.find('.multi-upload__cancel-btn');
      this.editor = options.editor;
      this.images = [];

      this.handleEvents();
    }

    _createClass(ImagesUpload, [{
      key: 'handleEvents',
      value: function handleEvents() {
        this.$insertButton.on('click.imagesUpload', this.onInsertButtonClick.bind(this));
        this.$cancelButton.on('click.imagesUpload,', this.onCancelClick.bind(this));
      }
    }, {
      key: 'clean',
      value: function clean() {
        this.abortXhr();
        this.images = [];
        this.$content.html('');
        this.checkInsertButton();
      }
    }, {
      key: 'abortXhr',
      value: function abortXhr() {
        this.images.forEach(function (image) {
          if (image.getStatus() !== IMAGE_UPLOAD_STATUS_SUCCESS) {
            image.abortXhr();
          }
        });
      }
    }, {
      key: 'onCancelClick',
      value: function onCancelClick() {
        this.editor.popups.hide(POPUP_NAME);
      }
    }, {
      key: 'onInsertButtonClick',
      value: function onInsertButtonClick() {
        if (!this.images || !this.images.length) {
          this.error('No images to insert');
          return;
        }
        this.editor.events.disableBlur();
        var uploadedImages = this.images.filter(function (image) {
          return image.getStatus() === IMAGE_UPLOAD_STATUS_SUCCESS;
        });
        this.insertImages(uploadedImages);
        this.editor.events.enableBlur();
      }
    }, {
      key: 'error',
      value: function error(text) {
        console.error(text);
        return this;
      }
    }, {
      key: 'insertImages',
      value: function insertImages(images) {
        var _this5 = this;

        var imgIndex = 0;
        this.editor.events.on('image.inserted', function ($img) {
          /* eslint-disable */
          new ImageInsert($img, _this5.editor);
          /* eslint-enable */
          imgIndex += 1;
          if (!images[imgIndex]) {
            _this5.clean();
            return;
          }
          _this5.insertImage(images[imgIndex]);
        });
        this.insertImage(images[imgIndex]);
      }
    }, {
      key: 'insertImage',
      value: function insertImage(image) {
        this.editor.image.insert(image.renderUrl, false, { uploaded_url: image.getUrl() }, null);
      }
    }, {
      key: 'add',
      value: function add(files) {
        var _this6 = this;

        if (!files || !(files instanceof FileList)) {
          this.error('No files are to add');
          return;
        }

        if (!this.$el.length) {
          this.error('Container `el` must be set');
          return;
        }

        [].forEach.call(files, function (file) {
          if (_this6.validate(file)) {
            var image = new ImageUpload({ file: file, editor: _this6.editor });
            _this6.handleImageEvents(image);
            _this6.$content.append(image.render());
            image.upload();
            _this6.images.push(image);
          }
        });
      }
    }, {
      key: 'validate',
      value: function validate(file) {
        return this.editor.opts.imageAllowedTypes.indexOf(file.type.replace(/image\//g, '')) > -1 || file.size < this.editor.opts.imageMaxSize;
      }
    }, {
      key: 'handleImageEvents',
      value: function handleImageEvents(image) {
        image.on('imageRemove', this.onImageRemove.bind(this, image));
        image.on('changeStatus', this.onStatusChange.bind(this));
      }
    }, {
      key: 'onStatusChange',
      value: function onStatusChange() {
        this.checkInsertButton();
      }
    }, {
      key: 'checkInsertButton',
      value: function checkInsertButton() {
        var disabled = !this.images.find(function (image) {
          return image.status === IMAGE_UPLOAD_STATUS_SUCCESS;
        });
        this.$insertButton.prop('disabled', disabled);
      }
    }, {
      key: 'onImageRemove',
      value: function onImageRemove(image) {
        var index = this.images.indexOf(image);
        if (index === -1) {
          return;
        }
        this.images.splice(index, 1);
        this.editor.events.disableBlur();
        image.remove();
        this.checkInsertButton();
        this.editor.events.enableBlur();
      }
    }]);

    return ImagesUpload;
  }();

  var UploadPopup = function () {
    function UploadPopup(options) {
      _classCallCheck(this, UploadPopup);

      this.editor = options.editor;
      this.template = options.template;
      this.name = options.name;
      this.$popup = null;
      this.imagesUpload = null;

      this.init();
    }

    _createClass(UploadPopup, [{
      key: 'init',
      value: function init() {
        var template = {
          custom_layer: this.template
        };

        this.$popup = this.editor.popups.create(this.name, template);
        this.imagesUpload = new ImagesUpload({
          editor: this.editor,
          el: this.$popup.find('.multi-upload')
        });
        this.handleEvents();
        return this.$popup;
      }
    }, {
      key: 'show',
      value: function show() {
        var editor = this.editor;

        editor.popups.setContainer(this.name, editor.$tb);
        var $btn = editor.$tb.find('.fr-command[data-cmd="imagesMultiUpload"]');
        var left = $btn.offset().left + $btn.outerWidth() / 2; // prettier-ignore
        var top = $btn.offset().top + (editor.opts.toolbarBottom ? 10 : $btn.outerHeight() - 10);
        editor.popups.show(this.name, left, top, $btn.outerHeight());
      }
    }, {
      key: 'handleEvents',
      value: function handleEvents() {
        var _this7 = this;

        var editor = this.editor,
            $popup = this.$popup,
            imagesUpload = this.imagesUpload;


        editor.events.$on($popup, 'change', '.fr-image-upload-layer input[type="file"]', function (event) {
          var ed = $popup.data('instance') || editor;
          ed.events.disableBlur();
          imagesUpload.add(event.currentTarget.files);
          _this7.value = null; // reset input file
          ed.events.enableBlur();
        });

        editor.events.$on($popup, 'dragover dragenter', '.fr-image-upload-layer', function (event) {
          $(event.currentTarget).addClass('fr-drop');
          return false;
        }, true);

        editor.events.$on($popup, 'dragleave dragend', '.fr-image-upload-layer', function (event) {
          $(event.currentTarget).removeClass('fr-drop');
          return false;
        }, true);

        editor.events.$on($popup, 'drop', '.fr-image-upload-layer', function (event) {
          event.preventDefault();
          $(event.currentTarget).removeClass('fr-drop');
          var dataTransfer = event.originalEvent.dataTransfer;

          if (dataTransfer && dataTransfer.files) {
            var ed = $popup.data('instance') || editor;
            ed.events.disableBlur();
            imagesUpload.add(dataTransfer.files);
            ed.events.enableBlur();
          }
        }, true);

        if (editor.helpers.isIOS()) {
          editor.events.$on($popup, 'touchstart', '.fr-image-upload-layer input[type="file"]', function (event) {
            $(event.currentTarget).trigger('click');
          }, true);
        }
      }
    }]);

    return UploadPopup;
  }();

  var templates = {};
  templates[POPUP_NAME] = '[_CUSTOM_LAYER_]';
  $.extend($.FroalaEditor.POPUP_TEMPLATES, templates);

  /* eslint-disable */
  $.FroalaEditor.PLUGINS.imagesMultiUpload = function (editor) {
    /* eslint-enable */
    var uploadPopup = void 0;

    function showPopup() {
      if (!uploadPopup) {
        uploadPopup = new UploadPopup({
          editor: editor,
          template: dropTemplate,
          name: POPUP_NAME
        });
      }
      uploadPopup.show();
    }

    return {
      showPopup: showPopup
    };
  };

  $.FroalaEditor.DefineIcon('imagesMultiUploadIcon', { NAME: 'file-image-o' });
  $.FroalaEditor.RegisterCommand('imagesMultiUpload', {
    title: 'Images Multi Upload',
    icon: 'imagesMultiUploadIcon',
    undo: false,
    focus: false,
    plugin: 'imagesMultiUpload',
    showOnMobile: true,
    callback: function callback() {
      this.imagesMultiUpload.showPopup();
    }
  });
});