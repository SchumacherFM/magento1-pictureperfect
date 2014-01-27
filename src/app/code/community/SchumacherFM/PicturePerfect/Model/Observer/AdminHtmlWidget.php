<?php
/**
 * @category    SchumacherFM_PicturePerfect
 * @package     Helper
 * @author      Cyrill at Schumacher dot fm / @SchumacherFM
 * @copyright   Copyright (c)
 */
class SchumacherFM_PicturePerfect_Model_Observer_AdminHtmlWidget
{

    public function insertLoadGalleryButton(Varien_Event_Observer $observer)
    {
        $block = $observer->getEvent()->getBlock();

        if ($block instanceof Mage_Adminhtml_Block_Catalog_Product) {

            $block->addButton('picturePerfectMassAction', array(
                'label' => Mage::helper('pictureperfect')->__('Load Gallery Images'),
                'class' => 'picturePerfectMassAction'
            ), 0, -1000);
        }
    }
}