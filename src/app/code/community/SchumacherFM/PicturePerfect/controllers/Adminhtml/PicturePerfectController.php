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
            $galleries[$product->getId()] = Mage::helper('pictureperfect/gallery')->getResizedGalleryImages($product);
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
        $bdReqId      = (int)$this->getRequest()->getParam('bdReqId', 0);
        $bdTotalFiles = (int)$this->getRequest()->getParam('bdTotalFiles', 0);

        $tmpFileNames = Mage::helper('pictureperfect')->getUploadedFilesNames();

        if (TRUE === is_string($tmpFileNames)) {
            $return['msg'] = $tmpFileNames;
            return $this->_setReturn($return, TRUE);
        }

        $uniqueFileName = Mage::helper('pictureperfect')->getUploadFileBaseName($tmpFileNames);

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

        // multiple req uploads
        if ($bdReqCount > 1) {
            $chunkedFiles = Mage::helper('pictureperfect')->getAlreadyUploadedFileChunks($uniqueFileName, $bdTotalFiles);

            if ($bdReqId === $bdReqCount && count($chunkedFiles) === $bdTotalFiles) { // all chunks arrived
                $tmpFileNames = $chunkedFiles;
                $bdReqCount   = 1;
            } else {
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
            $return        = Mage::helper('pictureperfect/gallery')->addImageToProductGallery($return, $fullImagePath);
            return $this->_setReturn($return, TRUE);
        } else {

            $return['msg'] = $helper->__('No request found for processing...');
            return $this->_setReturn($return, TRUE);
        }
    }
}