<?php

/**
 * @category    SchumacherFM_PicturePerfect
 * @package     Helper
 * @author      Cyrill at Schumacher dot fm / @SchumacherFM
 * @copyright   Copyright (c) Please read the EULA
 */
class SchumacherFM_PicturePerfect_Helper_Gallery extends Mage_Core_Helper_Abstract
{
    /**
     * @param Mage_Catalog_Model_Product $product
     *
     * @return mixed
     */
    public function getResizedGalleryImages(Mage_Catalog_Model_Product $product)
    {
        $images  = $product->getMediaGallery('images');
        $baseDir = Mage::getSingleton('catalog/product_media_config')->getBaseMediaPath();

        foreach ($images as &$image) {

            $currentImage = $baseDir . DS . $image['file'];
            $fileSize     = $this->getFileSize($currentImage);
            /** @var Mage_Catalog_Helper_Image $catalogImage */
            $catalogImage = Mage::helper('catalog/image')->init($product, 'thumbnail', $image['file'])->resize(60);

            $image['resized']        = (string)$catalogImage;
            $image['fileSize']       = $fileSize;
            $image['fileSizePretty'] = $this->getPrettySize($fileSize);
            $image['widthHeight']    = $this->getImageWithHeight($currentImage);
            $image['label']          = htmlspecialchars($image['label']);
        }
        return $images;
    }

    /**
     * @param $file
     *
     * @return int
     */
    public function getFileSize($file)
    {
        $size = 0;
        if (file_exists($file)) {
            $size = filesize($file);
        }
        return $size;
    }

    /**
     * @param $bytes
     *
     * @return string
     */
    public function getPrettySize($bytes)
    {
        if ($bytes < 0.1) {
            return '';
        }
        $s = array('bytes', 'KB', 'MB', 'GB', 'TB', 'PB');
        $e = floor(log($bytes) / log(1024));
        return sprintf('%.2f', $bytes / pow(1024, floor($e))) . ' ' . $s[$e];
    }

    /**
     * @param string $absolutePathToImage
     *
     * @return string
     */
    public function getImageWithHeight($absolutePathToImage)
    {
        $imageData = @getimagesize($absolutePathToImage);
        $return    = '';
        if (FALSE !== $imageData) {
            $return = $imageData[0] . ' x ' . $imageData[1] . 'px';
        }
        return $return;
    }

    /**
     * @param array $return
     * @param       $fullImagePath
     *
     * @return array
     */
    public function addImageToProductGallery(array $return, $fullImagePath)
    {
        /** @var Mage_Catalog_Model_Product $product */
        $product = Mage::helper('pictureperfect')->getProduct();

        try {
            $product->addImageToMediaGallery($fullImagePath, NULL, TRUE, FALSE);
            Mage::helper('pictureperfect/label')->generateLabelFromFileName($product, $fullImagePath);
            $product->getResource()->save($product); // bypassing observer
            $return['images'] = $this->getResizedGalleryImages($product);
        } catch (Exception $e) {
            $return['err'] = TRUE;
            $return['msg'] = Mage::helper('pictureperfect')->__('Error in saving the image: %s for productId: %s', $fullImagePath, $product->getId());
            Mage::logException($e);
        }

        return $return;
    }
}