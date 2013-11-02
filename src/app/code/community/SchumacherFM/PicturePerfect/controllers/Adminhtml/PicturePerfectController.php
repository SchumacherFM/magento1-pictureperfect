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
        $helper = Mage::helper('pictureperfect');
        $return = array(
            'err'    => TRUE,
            'msg'    => $helper->__('An error occurred.'),
            'fn'     => '',
            'images' => FALSE
        );

        $productId = (int)$this->getRequest()->getParam('productId', 0);

        /** @var Mage_Catalog_Model_Product $product */
        $product    = Mage::getModel('catalog/product')->load($productId);
        $binaryData = base64_decode($this->getRequest()->getParam('binaryData', ''));
        $file       = json_decode($this->getRequest()->getParam('file', '[]'), TRUE);
        $fileName   = preg_replace('~[^\w\.\-_\(\)@#]+~i', '', isset($file['name']) ? $file['name'] : '');

        if (empty($fileName) || empty($binaryData) || empty($file) || empty($productId)) {
            $return['msg'] = $helper->__('Either fileName or binaryData or file is empty ...');
            Mage::log(array(
                'catalogProductGalleryAction',
                $fileName,
                empty($binaryData) ? '$binaryData empty' : '$binaryData available',
                $file,
                $productId
            ));
            return $this->_setReturn($return, TRUE);
        }

        $io = new Varien_Io_File();
        if ($io->checkAndCreateFolder($this->_getTempStorage())) {
            $result = (int)file_put_contents($this->_getTempStorage() . $fileName, $binaryData); // io->write will not work :-(
            if ($result > 10) {
                $return['err'] = FALSE;
                $return['msg'] = $helper->__('Upload successful for image: %s', $fileName);
                $return['fn']  = $fileName;
            }
        }

        try {
            $product->addImageToMediaGallery($this->_getTempStorage() . $fileName, NULL, TRUE, FALSE);
            $product->getResource()->save($product); // bypassing observer
            $return['images'] = $this->_getResizedGalleryImages($product);
        } catch (Exception $e) {
            $return['err'] = TRUE;
            $return['msg'] = $helper->__('Error in saving the image: %s for productId: %s', $fileName, $productId);
            Mage::logException($e);
        }

        $this->_setReturn($return, TRUE);
    }

    /**
     * @param Mage_Catalog_Model_Product $product
     *
     * @return mixed
     */
    protected function _getResizedGalleryImages(Mage_Catalog_Model_Product $product)
    {
        $images = $product->getMediaGallery('images');
        foreach ($images as &$image) {
            $image['resized'] = (string)Mage::helper('catalog/image')->init($product, 'thumbnail', $image['file'])->resize(60);
        }
        return $images;
    }

    /**
     * Images Storage root directory
     *
     * @return string
     */
    protected function _getTempStorage()
    {
        return Mage::getBaseDir() . DS . 'var' . DS . 'pictureperfect' . DS;
    }
}