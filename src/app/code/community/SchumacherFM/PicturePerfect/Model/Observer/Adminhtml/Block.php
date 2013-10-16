<?php
/**
 * @category    SchumacherFM_PicturePerfect
 * @package     Observer
 * @author      Cyrill at Schumacher dot fm / @SchumacherFM
 * @copyright   Copyright (c)
 */
class SchumacherFM_PicturePerfect_Model_Observer_Adminhtml_Block
{

    /**
     * adminhtml_block_html_before
     *
     * @param Varien_Event_Observer $observer
     *
     * @return null
     */
    public function alterTextareaBlockTemplate(Varien_Event_Observer $observer)
    {
        if (Mage::helper('pictureperfect')->isDisabled()) {
            return NULL;
        }
    }
}