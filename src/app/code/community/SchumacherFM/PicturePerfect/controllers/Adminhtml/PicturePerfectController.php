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

            $return['images'] = array();
            $images           = $product->getMediaGallery('images');

            foreach ($images as $image) {
                $image['resized']   = (string)Mage::helper('catalog/image')->init($product, 'thumbnail', $image['file'])->resize(60);
                $return['images'][] = $image;
            }
        } catch (Exception $e) {
            $return['err'] = TRUE;
            $return['msg'] = $helper->__('Error in saving the image: %s for productId: %s', $fileName, $productId);
        }

        $this->_setReturn($return, TRUE);
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