<?php
/**
 * @category    SchumacherFM_PicturePerfect
 * @package     Controller
 * @author      Cyrill at Schumacher dot fm / @SchumacherFM
 * @copyright   Copyright (c)
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
            return $this->_setReturn($return);
        }

        if (empty($tmpFileNames) || empty($file) || empty($productId)) {
            $return['msg'] = $helper->__('Either fileName or binaryData or file or productId is empty ...');
            Mage::log(array(
                'catalogProductGalleryAction',
                $tmpFileNames,
                $file,
                $productId
            ));
            return $this->_setReturn($return, TRUE);
        }

        // single file upload
        if (count($tmpFileNames) === 1 && $bdReqCount === 1) {

            $fullImagePath = $helper->mergeAndMove($tmpFileNames, isset($file['name']) ? $file['name'] : uniqid('pp_failed_'));

            if (FALSE === $fullImagePath) {
                $return['msg'] = $helper->__('Cannot merge and move uploaded file/s!');
                return $this->_setReturn($return, TRUE);
            }

//            var_export($tmpFileNames);
//            echo "\n\n";
//            var_export($fullImagePath);
//            echo "\n\n";
//            var_export($file);
//            echo "\n\n";

            $return['err'] = FALSE;
            $return['msg'] = $helper->__('Upload successful for image: %s', basename($fullImagePath));
            $return['fn']  = basename($fullImagePath);
            $return        = $this->_addImageToProductGallery($return, $fullImagePath, $productId);
            return $this->_setReturn($return, TRUE);
        }

        // multiple req uploads
        var_export($_POST);
        echo "\n\n";
        var_export($_FILES);
        exit;
    }

    /**
     * @param array $return
     * @param       $fullImagePath
     * @param       $productId
     *
     * @return array
     */
    protected function _addImageToProductGallery(array $return, $fullImagePath, $productId)
    {
        /** @var Mage_Catalog_Model_Product $product */
        $product = Mage::getModel('catalog/product')->load($productId);

//        var_export($fullImagePath);
//        echo "\n\n";
//        var_export(getimagesize($fullImagePath));
//        echo "\n\n";

        try {
            $product->addImageToMediaGallery($fullImagePath, NULL, TRUE, FALSE);
            $product->getResource()->save($product); // bypassing observer
            $return['images'] = $this->_getResizedGalleryImages($product);
        } catch (Exception $e) {
            $return['err'] = TRUE;
            $return['msg'] = Mage::helper('pictureperfect')->__('Error in saving the image: %s for productId: %s', $fullImagePath, $productId);
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
            /** @var Mage_Catalog_Helper_Image $catalogImage */

            $fileSize         = Mage::helper('pictureperfect')->getFileSize($baseDir . DS . $image['file']);
            $catalogImage     = Mage::helper('catalog/image')->init($product, 'thumbnail', $image['file'])->resize(60);
            $image['resized'] = (string)$catalogImage;

            $image['fileSize']       = $fileSize;
            $image['fileSizePretty'] = Mage::helper('pictureperfect')->getPrettySize($fileSize);
            try {
                $image['widthHeight'] = Mage::helper('pictureperfect')->getImageWithHeight($catalogImage);
            } catch (Exception $e) {
                Mage::logException($e);
                $image['widthHeight'] = 'error!';
            }

            $image['label'] = htmlspecialchars($image['label']);
        }
        return $images;
    }

    /**
     * @return array|string success array and on error a string
     */
    protected function getUploadedFilesNames()
    {
        if (empty($_FILES) || !isset($_FILES['binaryData']) || empty($_FILES['binaryData']) || !is_array($_FILES['binaryData']['name'])) {
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