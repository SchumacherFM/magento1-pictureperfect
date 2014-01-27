<?php

/**
 * Adminhtml cms blocks content block
 *
 * @category    Mage
 * @package     Mage_Adminhtml
 * @author      Magento Core Team <core@magentocommerce.com>
 */
class SchumacherFM_PicturePerfect_Block_Adminhtml_Config extends Mage_Adminhtml_Block_Abstract
{
    /**
     * @return string json encoded
     */
    protected function _getConfig()
    {
        $config = array(
            'uploadUrl'  => $this->getUrl('*/picturePerfect/catalogProductGallery'),
            'galleryUrl' => $this->getUrl('*/picturePerfect/catalogProductGetGalleryByIds'),
            'form_key'   => Mage::getSingleton('core/session')->getFormKey(),
            'post' => array(
                'postMaxSize'       => Mage::helper('pictureperfect')->getPostMaxSize(),
                'uploadMaxFileSize' => Mage::helper('pictureperfect')->getUploadMaxFileSize(),
                'maxFileUploads'    => Mage::helper('pictureperfect')->getMaxFileUploads(),
            ),
        );
        return Zend_Json_Encoder::encode($config);
    }

    /**
     * @return string
     */
    protected function _toHtml()
    {
        return '<div style="display:none;" id="picturePerfectConfig" data-config=\'' .
        $this->_getConfig() . '\'></div>';
    }
}
