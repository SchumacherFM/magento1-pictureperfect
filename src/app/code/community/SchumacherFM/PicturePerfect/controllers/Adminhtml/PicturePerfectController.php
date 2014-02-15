<?php

/**
 * @category    SchumacherFM_PicturePerfect
 * @package     Controller
 * @author      Cyrill at Schumacher dot fm / @SchumacherFM
 * @copyright   Copyright (c) Please read the EULA
 */
class SchumacherFM_PicturePerfect_Adminhtml_PicturePerfectController extends Mage_Adminhtml_Controller_Action
{

    /**
     * @param string $string
     * @param bool   $jsonEncode
     *
     * @return $this
     */
    protected function _setReturn($string = '', $jsonEncode = FALSE)
    {
        if (TRUE === $jsonEncode) {
            $this->getResponse()->setHeader('Content-type', 'application/json', TRUE);
        }
        $this->getResponse()->setBody($jsonEncode ? Zend_Json_Encoder::encode($string) : $string);
        return $this;
    }

    /**
     * gets all gallery images for a product id
     */
    public function catalogProductGetGalleryByIdsAction()
    {
        $helper = Mage::helper('pictureperfect');
        $return = array(
            'err'    => TRUE,
            'msg'    => $helper->__('An error occurred.'),
            'images' => NULL
        );

        if (FALSE === $this->getRequest()->isPost()) {
            return $this->_setReturn($return, TRUE);
        }
        $productIds = explode(',', $this->getRequest()->getParam('productIds', ''));
        foreach ($productIds as &$productId) {
            $productId = (int)$productId;
        }
        /** @var Mage_Catalog_Model_Resource_Product_Collection $collection */
        $collection = Mage::getModel('catalog/product')->getCollection();
        $collection
            ->addAttributeToFilter('entity_id', array('in' => $productIds))
            ->setOrder('entity_id');

        if ($collection->count() === 0) {
            $return['msg'] = $helper->__('Cannot find product entities: ' . var_export($productIds, 1));
            return $this->_setReturn($return, TRUE);
        }

        /** @var Mage_Catalog_Model_Resource_Eav_Attribute $mediaGalleryAttribute */
        $mediaGalleryAttribute   = Mage::getSingleton('eav/config')->getAttribute(Mage_Catalog_Model_Product::ENTITY, 'media_gallery');
        $mediaGalleryAttributeId = (int)$mediaGalleryAttribute->getAttributeId();

        if (0 === $mediaGalleryAttributeId) {
            $return['msg'] = $helper->__('Cannot find media_gallery attribute in eav/attributes.');
            return $this->_setReturn($return, TRUE);
        }

        /** @var Mage_Catalog_Model_Product_Attribute_Backend_Media $mediaGalleryBackend */
        $mediaGalleryBackend = $mediaGalleryAttribute->getBackend();

        if (FALSE === ($mediaGalleryBackend instanceof Mage_Catalog_Model_Product_Attribute_Backend_Media)) {
            $return['msg'] = $helper->__('Cannot find media_gallery backend in eav/attributes.');
            return $this->_setReturn($return, TRUE);
        }

        $return['msg'] = '';
        $return['err'] = FALSE;

        $galleries = array();
        foreach ($collection as $product) {
            /** @var $product Mage_Catalog_Model_Product */
            $mediaGalleryBackend->afterLoad($product);
            $galleries[$product->getId()] = $this->_getResizedGalleryImages($product);
        }
        $return['images'] = $galleries;
        return $this->_setReturn($return, TRUE);
    }

    /**
     * @return $this
     */
    public function catalogProductGalleryAction()
    {

        /** @var SchumacherFM_PicturePerfect_Helper_Data $helper */
        $helper = Mage::helper('pictureperfect');

        $return = array(
            'err'    => TRUE,
            'msg'    => $helper->__('An error occurred.'),
            'fn'     => '',
            'images' => FALSE
        );

        $file         = json_decode($this->getRequest()->getParam('file', '[]'), TRUE);
        $productId    = (int)$this->getRequest()->getParam('productId', 0);
        $bdReqCount   = (int)$this->getRequest()->getParam('bdReqCount', 0);
        $bdTotalFiles = (int)$this->getRequest()->getParam('bdTotalFiles', 0);

        $tmpFileNames = $this->getUploadedFilesNames();

        if (TRUE === is_string($tmpFileNames)) {
            $return['msg'] = $tmpFileNames;
            return $this->_setReturn($return, TRUE);
        }

        $uniqueFileName = $this->_getUploadFileBaseName($tmpFileNames);

        if (empty($tmpFileNames) || empty($file) || empty($productId) || FALSE === $uniqueFileName) {
            $return['msg'] = $helper->__('Either fileName or binaryData or file or productId is empty ...');
            Mage::log(array(
                'catalogProductGalleryAction Failed',
                $tmpFileNames,
                $uniqueFileName,
                $file,
                $productId
            ));
            return $this->_setReturn($return, TRUE);
        }

        Mage::helper('pictureperfect')->getProduct($productId); // init product model in helper

        if ($bdReqCount > 1) {
            // multiple req uploads

            $sessionDataKey = 'ppFileNames' . $uniqueFileName;
            /** @var Mage_Adminhtml_Model_Session $session */
            $session             = Mage::getSingleton('adminhtml/session');
            $tmpFileNamesSession = $session->getData($sessionDataKey);
            if (empty($tmpFileNamesSession)) {
                $tmpFileNamesSession = $tmpFileNames;
            } else {
                $tmpFileNamesSession = array_merge($tmpFileNamesSession, $tmpFileNames);
            }

            if (count($tmpFileNamesSession) === $bdTotalFiles) {
                $tmpFileNames = $tmpFileNamesSession;
                $bdReqCount   = 1;
                $session->unsetData($sessionDataKey);
            } else {
                $session->setData($sessionDataKey, $tmpFileNamesSession);
                return $this->_setReturn(array('fileProgress' => $uniqueFileName), TRUE);
            }
        }

        // one request but 1 to many files
        if ($bdReqCount === 1) {
            sort($tmpFileNames); // now that is important to restore the order after async upload!
            $newFileName   = Mage::helper('pictureperfect')->rewriteFileNameWithProductAttributes(
                isset($file['name']) ? $file['name'] : uniqid('pp_failed_')
            );
            $fullImagePath = $helper->mergeAndMove($tmpFileNames, $newFileName);

            if (FALSE === $fullImagePath) {
                $return['msg'] = $helper->__('Cannot merge and move uploaded file/s!');
                return $this->_setReturn($return, TRUE);
            }

            $return['err'] = FALSE;
            $return['msg'] = $helper->__('Upload successful for image: %s', basename($fullImagePath));
            $return['fn']  = basename($fullImagePath);
            $return        = $this->_addImageToProductGallery($return, $fullImagePath);
            return $this->_setReturn($return, TRUE);
        } else {

            $return['msg'] = $helper->__('No request found for processing...');
            return $this->_setReturn($return, TRUE);
        }
    }

    /**
     * @param $tmpFileNames
     *
     * @return bool
     */
    protected function _getUploadFileBaseName($tmpFileNames)
    {
        $file    = current($tmpFileNames);
        $matches = array();
        preg_match('~/(pp_[a-z0-9]{5,})__~', $file, $matches);
        return isset($matches[1]) ? $matches[1] : FALSE;
    }

    /**
     * @param array $return
     * @param       $fullImagePath
     *
     * @return array
     */
    protected function _addImageToProductGallery(array $return, $fullImagePath)
    {
        /** @var Mage_Catalog_Model_Product $product */
        $product = Mage::helper('pictureperfect')->getProduct();

        try {
            $product->addImageToMediaGallery($fullImagePath, NULL, TRUE, FALSE);
            Mage::helper('pictureperfect/label')->generateLabelFromFileName($product, $fullImagePath);
            $product->getResource()->save($product); // bypassing observer
            $return['images'] = $this->_getResizedGalleryImages($product);
        } catch (Exception $e) {
            $return['err'] = TRUE;
            $return['msg'] = Mage::helper('pictureperfect')->__('Error in saving the image: %s for productId: %s', $fullImagePath, $product->getId());
            Mage::logException($e);
        }

        return $return;
    }

    /**
     * @param Mage_Catalog_Model_Product $product
     *
     * @return mixed
     */
    protected function _getResizedGalleryImages(Mage_Catalog_Model_Product $product)
    {
        $images  = $product->getMediaGallery('images');
        $baseDir = Mage::getSingleton('catalog/product_media_config')->getBaseMediaPath();

        foreach ($images as &$image) {

            $currentImage = $baseDir . DS . $image['file'];
            $fileSize     = Mage::helper('pictureperfect')->getFileSize($currentImage);
            /** @var Mage_Catalog_Helper_Image $catalogImage */
            $catalogImage = Mage::helper('catalog/image')->init($product, 'thumbnail', $image['file'])->resize(60);

            $image['resized']        = (string)$catalogImage;
            $image['fileSize']       = $fileSize;
            $image['fileSizePretty'] = Mage::helper('pictureperfect')->getPrettySize($fileSize);
            $image['widthHeight']    = Mage::helper('pictureperfect')->getImageWithHeight($currentImage);
            $image['label']          = htmlspecialchars($image['label']);
        }
        return $images;
    }

    /**
     * @return array|string success array and on error a string
     */
    protected function getUploadedFilesNames()
    {
        if (empty($_FILES) || !isset($_FILES['binaryData']) || empty($_FILES['binaryData']) || !is_array($_FILES['binaryData']['name'])) {
            Mage::log(array('getUploadedFilesNames', $_FILES, $_GET, $_POST));
            return Mage::helper('pictureperfect')->__('No file found that should have been uploaded');
        }

        /**
         * Varien_File_Uploader cannot handle arrays ... like we are using here
         */
        $tempStorage = Mage::helper('pictureperfect')->getTempStorage();
        $fileNames   = array();
        foreach ($_FILES['binaryData']['error'] as $index => $error) {
            if ($error !== UPLOAD_ERR_OK) {
                return Mage::helper('pictureperfect')->__('An upload error occurred for file: ' . $_FILES['binaryData']['name'][$index]);
            }

            $res = move_uploaded_file($_FILES['binaryData']['tmp_name'][$index], $tempStorage . $_FILES['binaryData']['name'][$index]);
            if (FALSE === $res) {
                return Mage::helper('pictureperfect')->__('An upload error occurred during moving for file: ' . $_FILES['binaryData']['name'][$index]);
            }
            $fileNames[] = $tempStorage . $_FILES['binaryData']['name'][$index];
        } //endForeach
        return $fileNames;
    }
}