# Images Multi Upload 

The plugin for one of best wysiwyg-editors - [Froala Editor](https://www.froala.com/wysiwyg-editor/). The plugin allows to upload one or more images to the server. 

## Installing

Download or use `npm`

```shell
npm install https://github.com/heymexa/froala-images-multi-upload.git
```

## Usage
Include files in your html if you do not use build tools
```html
<!-- Include the plugin CSS file -->
<link rel="stylesheet" href="/path_to_plugin_css/imagesMultiUpload.css">
 
<!-- Include the plugin JS file -->
<script src="/path_to_plugin_js/imagesMultiUpload.js"></script>
```

or import in your js 
```javascript
// import js
import 'froala-images-multi-upload/build/js/imagesMultiUpload';

// import css
import 'froala-images-multi-upload/build/css/imagesMultiUpload.css';
```

## Configuration

The plugin uses to compatibility some options from the plugin `image.js`.

* `imageUploadURL` - The URL where the images uploaded by the user are saved
* `imageUploadParam` - Customize the name of the parameter that contains the image file in the upload request.
* `imageUploadParams` - Pass additional parameters to the upload request.
* `imageAllowedTypes` - The list of image types that are allowed to be uploaded. Although this will restrict uploading other types of files, we strongly recommend you to check the file type on the server too.
* `imageMaxSize` - The maximum image size allowed on upload in bytes. The default value is 10MB. Although this makes an additional check before uploading the image, it is highly recommended to check image size on your server too.


## Building

```shell
npm run build
```

## License

The code in this project is licensed under MIT license.