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
        $config               = array();
        $config['uploadUrl']  = $this->getUrl('*/picturePerfect/catalogProductGallery');
        $config['galleryUrl'] = $this->getUrl('*/picturePerfect/catalogProductGetGalleryByIds');
        $config['form_key']   = Mage::getSingleton('core/session')->getFormKey();
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
