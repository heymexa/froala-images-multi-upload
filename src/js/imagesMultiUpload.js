/* eslint-disable */
!(function(window, callback) {
  'object' == typeof exports && 'undefined' != typeof module
    ? callback(require('froala-editor'))
    : 'function' == typeof define && define.amd
    ? define(['froala-editor'], callback)
    : callback(window.FroalaEditor);
  /* eslint-enable */
})(window, FroalaEditor => {
  const PLUGIN_NAME = 'imagesMultiUpload';
  const POPUP_NAME = `${PLUGIN_NAME}.popup`;

  let $ = null;

  const dropZone = `
    <div class="fr-image-upload-layer fr-active fr-layer fp-image-upload-dropzone">
      <strong>Drop image</strong><br>(or click)
      <div class="fr-form">
        <input type="file" multiple="" accept="image/jpeg, image/jpg, image/png, image/gif" 
            tabindex="-1" aria-labelledby="fr-image-upload-layer-1" role="button" dir="auto">
      </div>
    </div>`;
  const multiUpload = `
    <div class="multi-upload">
    <div class="multi-upload__content"></div>
    <div class="multi-upload__buttons">
        <button class="multi-upload__btn multi-upload__insert-btn" disabled>Insert images</button>
        <button class="multi-upload__btn multi-upload__cancel-btn">Cancel</button>
    </div></div>`;
  const dropTemplate = `<div class="images-multi-upload">${dropZone}${multiUpload}</div>`;

  const IMAGE_UPLOAD_STATUS_PENDING = 1;
  const IMAGE_UPLOAD_STATUS_SUCCESS = 2;
  const IMAGE_UPLOAD_STATUS_ERROR = 3;

  class ImageUpload {
    constructor(options) {
      this.$ = options.$;
      this.$el = $(`<div class="upload-image">
        <div class="upload-image__container">
        <div class="upload-image__progressbar"><div class="upload-image__progressbar-line"></div></div>
        <div class="upload-image__image"></div>
        <button title="remove" class="upload-image__close-btn">x</button>
        </div></div>`);
      this.editor = options.editor;
      this.$image = this.$el.find('.upload-image__image');
      this.$closeBtn = this.$el.find('.upload-image__close-btn');
      this.$progressLine = this.$el.find('.upload-image__progressbar-line');
      this.image = options.file;
      this.url = null;
      this.status = 0;
      this.xhr = null;

      this.onStatusChange = options.onStatusChange;
      this.onImageRemove = options.onImageRemove;

      this.handleEvents();
    }

    handleEvents() {
      this.$closeBtn.on('click', this.onRemove.bind(this));
    }

    getStatus() {
      return this.status;
    }

    abortXhr() {
      this.xhr.abort();
      return this;
    }

    static isFileReaderAvailable() {
      return window.File && window.FileReader && window.FileList && window.Blob;
    }

    startLoading() {
      this.$el.addClass('upload-image--loading');
    }

    stopLoading() {
      this.$el.removeClass('upload-image--loading');
    }

    readImage() {
      if (ImageUpload.isFileReaderAvailable()) {
        const reader = new FileReader();
        reader.addEventListener('load', event => {
          this.renderImage(event.target.result);
        });
        reader.readAsDataURL(this.image);
      }
    }

    changeProgress(progress) {
      this.$progressLine.css({ width: `${progress}%` });
    }

    renderImage(url) {
      this.renderUrl = url;
      this.$image.css({ backgroundImage: `url(${url})` });
    }

    getUrl() {
      return this.url;
    }

    error() {
      this.$el.addClass('image-upload--error');
      this.setStatus(IMAGE_UPLOAD_STATUS_ERROR);
    }

    upload() {
      if (!this.image) {
        console.error('Property `image` must be set');
        return;
      }
      this.readImage();
      this.setStatus(IMAGE_UPLOAD_STATUS_PENDING);
      this.startLoading();

      const formData = new FormData();
      formData.append(this.editor.opts.imageUploadParam, this.image, this.image.name);
      Object.keys(this.editor.opts.imageUploadParams).forEach(uploadParam => {
        formData.append(uploadParam, this.editor.opts.imageUploadParams[uploadParam]);
      });

      this.xhr = new XMLHttpRequest();
      this.xhr.onload = () => {
        console.log('image load');
        this.stopLoading();
        let response = this.xhr.responseText;
        if (typeof response === 'string') {
          response = JSON.parse(response);
        }
        if (!response.link) {
          this.error();
        }
        if (!ImageUpload.isFileReaderAvailable()) {
          this.renderImage(response.link);
        }
        this.url = response.link;
        this.setStatus(IMAGE_UPLOAD_STATUS_SUCCESS);
      };
      this.xhr.onerror = () => {
        this.stopLoading();
        this.error();
      };
      this.xhr.upload.addEventListener(
        'progress',
        evt => {
          console.log(evt);
          if (evt.lengthComputable) {
            let percentComplete = evt.loaded / evt.total;
            percentComplete = parseInt(percentComplete * 100, 10);
            this.changeProgress(percentComplete);
          }
        },
        false
      );
      this.xhr.open('POST', this.editor.opts.imageUploadURL);
      this.xhr.send(formData);
    }

    setStatus(status) {
      this.status = status;
      this.onStatusChange(status);
      // this.trigger('changeStatus', status);
    }

    render() {
      return this.$el;
    }

    onRemove(event) {
      event.preventDefault();
      this.onImageRemove(this);
      // this.trigger('imageRemove', this);
    }

    remove() {
      this.abortXhr();
      this.$el.remove();
    }

    trigger(eventName, data) {
      setTimeout(() => {
        this.$el.triggerHandler(eventName, data);
      }, 0);
    }

    on(event, handler) {
      this.$el.on(event, handler);
    }
  }

  class ImageInsert {
    constructor($img, editor) {
      this.editor = editor;
      this.$el = $img;

      this.$el.addClass('image-insert');

      this.init();
    }

    init() {
      const image = new Image();
      image.src = this.$el.data('uploaded_url');
      this.$el.addClass('image-insert--loading').attr('title', this.editor.language.translate('Loading image'));
      image.onload = () => {
        this.$el.removeClass('image-insert--loading').attr({ src: image.src, title: '' });
      };
      image.onerror = () => {
        this.$el.removeClass('image-insert--loading').addClass('image-insert--error');
      };
    }
  }

  class ImagesUpload {
    constructor(options) {
      this.$ = options.$;
      this.$el = $(options.el);
      this.$content = this.$el.find('.multi-upload__content');
      this.$insertButton = this.$el.find('.multi-upload__insert-btn');
      this.$cancelButton = this.$el.find('.multi-upload__cancel-btn');
      this.editor = options.editor;
      this.images = [];

      this.handleEvents();
    }

    handleEvents() {
      this.$insertButton.on('click.imagesUpload', this.onInsertButtonClick.bind(this));
      this.$cancelButton.on('click.imagesUpload,', this.onCancelClick.bind(this));
    }

    clean() {
      this.abortXhr();
      this.images = [];
      this.$content.html('');
      this.checkInsertButton();
    }

    abortXhr() {
      this.images.forEach(image => {
        if (image.getStatus() !== IMAGE_UPLOAD_STATUS_SUCCESS) {
          image.abortXhr();
        }
      });
    }

    onCancelClick() {
      this.editor.popups.hide(POPUP_NAME);
    }

    onInsertButtonClick() {
      if (!this.images || !this.images.length) {
        this.error('No images to insert');
        return;
      }
      this.editor.events.disableBlur();
      const uploadedImages = this.images.filter(image => image.getStatus() === IMAGE_UPLOAD_STATUS_SUCCESS).reverse();
      this.insertImages(uploadedImages);
      this.editor.events.enableBlur();
    }

    error(text) {
      console.error(text);
      return this;
    }

    insertImages(images) {
      let imgIndex = 0;
      this.editor.events.on('image.inserted', $img => {
        /* eslint-disable */
        new ImageInsert($img, this.editor);
        this.editor.selection.setAfter($img.get(0));
        /* eslint-enable */
        imgIndex += 1;
        if (!images[imgIndex]) {
          this.clean();
          return;
        }
        this.insertImage(images[imgIndex]);
      });
      this.insertImage(images[imgIndex]);
    }

    insertImage(image) {
      this.editor.image.insert(image.renderUrl, false, { uploaded_url: image.getUrl() }, null);
    }

    add(files) {
      if (!files || !(files instanceof FileList)) {
        this.error('No files are to add');
        return;
      }

      if (!this.$el.length) {
        this.error('Container `el` must be set');
        return;
      }

      [].forEach.call(files, file => {
        if (this.validate(file)) {
          const image = new ImageUpload({
            file,
            editor: this.editor,
            $,
            onImageRemove: this.onImageRemove.bind(this),
            onStatusChange: this.onStatusChange.bind(this)
          });
          this.$content.append(image.render());
          image.upload();
          this.images.push(image);
        }
      });
    }

    validate(file) {
      return (
        this.editor.opts.imageAllowedTypes.indexOf(file.type.replace(/image\//g, '')) > -1 ||
        file.size < this.editor.opts.imageMaxSize
      );
    }

    onStatusChange() {
      this.checkInsertButton();
    }

    checkInsertButton() {
      const disabled = !this.images.find(image => image.status === IMAGE_UPLOAD_STATUS_SUCCESS);
      // this.$insertButton.attr('disabled', disabled);
      this.$insertButton[0].disabled = disabled;
    }

    onImageRemove(image) {
      console.log('image remove', image);
      const index = this.images.indexOf(image);
      if (index === -1) {
        return;
      }
      this.images.splice(index, 1);
      this.editor.events.disableBlur();
      image.remove();
      this.checkInsertButton();
      this.editor.events.enableBlur();
    }
  }

  class UploadPopup {
    constructor(options) {
      this.editor = options.editor;
      this.template = options.template;
      this.name = options.name;
      this.$popup = null;
      this.imagesUpload = null;
      this.$ = options.$;

      this.init();
    }

    init() {
      const template = {
        custom_layer: this.template
      };

      this.$popup = this.editor.popups.create(this.name, template);
      this.imagesUpload = new ImagesUpload({
        editor: this.editor,
        el: this.$popup.find('.multi-upload'),
        $: this.$
      });
      this.handleEvents();
      return this.$popup;
    }

    show() {
      const { editor } = this;
      editor.popups.setContainer(this.name, editor.$tb);
      const $btn = editor.$tb.find(`.fr-command[data-cmd="${PLUGIN_NAME}"]`);
      const left = $btn.offset().left + ($btn.outerWidth() / 2); // prettier-ignore
      const top = $btn.offset().top + (editor.opts.toolbarBottom ? 10 : $btn.outerHeight() - 10);
      editor.popups.show(this.name, left, top, $btn.outerHeight());
    }

    handleEvents() {
      const { editor, $popup, imagesUpload } = this;

      editor.events.$on($popup, 'change', '.fr-image-upload-layer input[type="file"]', event => {
        const ed = $popup.data('instance') || editor;
        ed.events.disableBlur();
        imagesUpload.add(event.currentTarget.files);
        this.value = null; // reset input file
        ed.events.enableBlur();
      });

      editor.events.$on(
        $popup,
        'dragover dragenter',
        '.fr-image-upload-layer',
        event => {
          $(event.currentTarget).addClass('fr-drop');
          return false;
        },
        true
      );

      editor.events.$on(
        $popup,
        'dragleave dragend',
        '.fr-image-upload-layer',
        event => {
          $(event.currentTarget).removeClass('fr-drop');
          return false;
        },
        true
      );

      editor.events.$on(
        $popup,
        'drop',
        '.fr-image-upload-layer',
        event => {
          event.preventDefault();
          $(event.currentTarget).removeClass('fr-drop');
          const { dataTransfer } = event.originalEvent;
          if (dataTransfer && dataTransfer.files) {
            const ed = $popup.data('instance') || editor;
            ed.events.disableBlur();
            imagesUpload.add(dataTransfer.files);
            ed.events.enableBlur();
          }
        },
        true
      );

      if (editor.helpers.isIOS()) {
        editor.events.$on(
          $popup,
          'touchstart',
          '.fr-image-upload-layer input[type="file"]',
          event => {
            $(event.currentTarget).trigger('click');
          },
          true
        );
      }
    }
  }

  /* eslint-disable-next-line */
  FroalaEditor.POPUP_TEMPLATES[POPUP_NAME] = '[_CUSTOM_LAYER_]';

  /* eslint-disable-next-line */
  FroalaEditor.PLUGINS[PLUGIN_NAME] = editor => {
    let uploadPopup;

    /* eslint-disable-next-line */
    $ = editor.$;

    function showPopup() {
      if (!uploadPopup) {
        uploadPopup = new UploadPopup({
          editor,
          template: dropTemplate,
          name: POPUP_NAME,
          $: editor.$
        });
      }
      uploadPopup.show();
    }

    return {
      showPopup
    };
  };

  const iconName = `${PLUGIN_NAME}Icon`;
  FroalaEditor.DefineIcon(iconName, { NAME: 'image', SVG_KEY: 'insertImage' });
  FroalaEditor.RegisterCommand(PLUGIN_NAME, {
    title: 'Images Multi Upload',
    icon: iconName,
    undo: false,
    focus: false,
    plugin: PLUGIN_NAME,
    showOnMobile: true,
    callback: function callback() {
      this[PLUGIN_NAME].showPopup();
    }
  });
});
