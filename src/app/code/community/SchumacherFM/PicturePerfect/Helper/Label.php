<?php

/**
 * @category    SchumacherFM_PicturePerfect
 * @package     Helper
 * @author      Cyrill at Schumacher dot fm / @SchumacherFM
 * @copyright   Copyright (c) Please read the EULA
 */
class SchumacherFM_PicturePerfect_Helper_Label extends Mage_Core_Helper_Abstract
{
    /**
     * @param Mage_Catalog_Model_Product $product
     * @param    string                  $fileName
     */
    public function generateLabelFromFileName(Mage_Catalog_Model_Product $product, $fileName)
    {
        $mediaGallery = $product->getData('media_gallery');
        $lastImage    = count($mediaGallery['images']) - 1;

        $label = $this->convertFileNameToLabel($fileName);
        if (FALSE !== $label) {
            $mediaGallery['images'][$lastImage]['label'] = $label;
        }

        $product->setData('media_gallery', $mediaGallery);
    }

    /**
     * @event  picture_perfect_convert_filename_to_label
     *
     * @param $fileName
     *
     * @return bool|string
     */
    public function convertFileNameToLabel($fileName)
    {
        if (FALSE === Mage::getStoreConfigFlag(SchumacherFM_PicturePerfect_Helper_Data::XML_CONFIG_GENERATE_LABEL)) {
            return FALSE;
        }

        $characters = trim(Mage::getStoreConfig(SchumacherFM_PicturePerfect_Helper_Data::XML_CONFIG_FILENAME_TO_LABEL_REPLACEMENT));
        if (empty($characters)) {
            $characters = '_';
        }
        $fileNameNoExt = $this->_removeFileExt($fileName);
        $label         = preg_replace('~[' . preg_quote($characters) . ']~', ' ', $fileNameNoExt);
        $transport     = new Varien_Object(array('file_name' => $fileName, 'label' => $label));
        Mage::dispatchEvent('picture_perfect_convert_file_name_to_label', array('transport' => $transport));
        return $transport->getLabel();
    }

    /**
     * @param string $fileName
     *
     * @return mixed
     */
    protected function _removeFileExt($fileName)
    {
        return preg_replace('~\.[\w]+$~i', '', basename($fileName));
    }
}