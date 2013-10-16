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
     * @todo better subdirectories
     *       saves a file in the dir: media/wysiwyg/pictureperfect/....
     *
     * @return $this
     */
    public function fileUploadAction()
    {

        $return     = array(
            'err'     => TRUE,
            'msg'     => 'An error occurred.',
            'fileUrl' => ''
        );
        $binaryData = base64_decode($this->getRequest()->getParam('binaryData', ''));
        $file       = json_decode($this->getRequest()->getParam('file', '[]'), TRUE);
        $fileName   = preg_replace('~[^\w\.]+~i', '', isset($file['name']) ? $file['name'] : '');

        if (empty($fileName) || empty($binaryData) || empty($file)) {
            $return['msg'] = 'Either fileName or binaryData or file is empty ...';
            return $this->_setReturn($return, TRUE);
        }

        $savePath = $this->_getStorageRoot() . $this->_getStorageSubDirectory();
        $io       = new Varien_Io_File();
        if ($io->checkAndCreateFolder($savePath)) {
            $result = (int)file_put_contents($savePath . $fileName, $binaryData); // io->write will not work :-(
            if ($result > 10) {
                $return['err']     = FALSE;
                $return['msg']     = '';
                $return['fileUrl'] = Mage::helper('pictureperfect')->getTemplateMediaUrl($this->_getStorageSubDirectory() . $fileName);
            }
        }

        $this->_setReturn($return, TRUE);
    }

    /**
     * @return mixed|string
     */
    protected function _getStorageSubDirectory()
    {
        $userDir = Mage::getStoreConfig('pictureperfect/file_reader/upload_dir');
        if (empty($userDir)) {
            $userDir = Mage_Cms_Model_Wysiwyg_Config::IMAGE_DIRECTORY . DS . 'pictureperfect' . DS;
        }
        return $userDir;
    }

    /**
     * Images Storage root directory
     *
     * @return string
     */
    protected function _getStorageRoot()
    {
        return Mage::getConfig()->getOptions()->getMediaDir() . DS;
    }
}