Magento PicturePerfect Module
=============================

PicturePerfect enables the Magento backend user to asynchronously upload multiple photos for different products via drag and drop in the backend catalog product grid.

PicturePerfect bypasses all PHP based file upload limitations. The only limit is the speed and performance of your computer and of course
the upload rate of your internet connection.

Why do I need this?
-------------------

Asynchronous upload of multiple photos for multiple products via drag and drop in the backend catalog product grid.

See the screencast:

![Screencapture GIF](https://raw.githubusercontent.com/SchumacherFM/magento1-pictureperfect/master/logo/screencastpictureperfect.gif)

Compatibility
-------------

| Browser | Minimum Version |
| --------|-----------------|
| Internet Explorer | 10 |
| Firefox | 23 |
| Chrome | 29 |
| Safari | 6 |
| Opera | 17 |

- File API [http://caniuse.com/#feat=fileapi](http://caniuse.com/#feat=fileapi)
- Progress Tag [http://caniuse.com/#feat=progressmeter](http://caniuse.com/#feat=progressmeter)


Configuration
-------------

All options can be set per store view.

PHP needs shell_exec function if you want to use the split file upload possibility.

Todo
----

- Upload images to a CDN via ftp/sftp/ssh
- Product Detail Edit: add uploader either in its own tab or via a tiny field on top.

Competitors
-----------

- Activo [Bulk Images Upload and SEO for Large Catalogs](http://www.magentocommerce.com/magento-connect/bulk-images-upload-and-seo-for-large-catalogs.html)
- Amasty [AJAX Image Uploader](http://amasty.com/ajax-image-uploader.html)


Installation Instructions
-------------------------
1. Install modman from https://github.com/colinmollenhour/modman
2. Switch to Magento root folder
3. `modman init`
4. `modman clone git://github.com/SchumacherFM/Magento-PicturePerfect.git`

Composer based installation:  Please read the great article from
Vinai [Composer installation](http://magebase.com/magento-tutorials/composer-with-magento/)

About
-----

- Key: SchumacherFM_PicturePerfect
- Current Version: 1.0.0
- [Download tarball](https://github.com/SchumacherFM/Magento-PicturePerfect/tags)

History
-------

#### 1.0.0

- Initial Release


Compatibility
-------------

- Magento >= 1.5
- php >= 5.2.0

There is the possibility that this extension may work with pre-1.5 Magento versions.

Support / Contribution
----------------------

Report a bug using the issue tracker or send us a pull request.

Instead of forking I can add you as a Collaborator IF you really intend to develop on this module. Just ask :-)

We work with: [A successful Git branching model](http://nvie.com/posts/a-successful-git-branching-model/) and [Semantic Versioning 2.0.0](http://semver.org/)

Licence
-------

[OSL - Open Software Licence 3.0](http://opensource.org/licenses/osl-3.0.php)

Copyright (c) 2013-2016 Cyrill (at) Schumacher dot fm

All rights reserved.


Author
------

[Cyrill Schumacher](https://github.com/SchumacherFM)

[My pgp public key](http://www.schumacher.fm/cyrill.asc)

Made in Sydney, Australia :-)
