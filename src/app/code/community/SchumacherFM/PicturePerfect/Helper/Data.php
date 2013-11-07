<?php
/**
 * @category    SchumacherFM_PicturePerfect
 * @package     Helper
 * @author      Cyrill at Schumacher dot fm / @SchumacherFM
 * @copyright   Copyright (c)
 */
class SchumacherFM_PicturePerfect_Helper_Data extends Mage_Core_Helper_Abstract
{
    /**
     * @todo if backend check for current selected store view / website
     *
     * check if MD is enabled ... per store view
     *
     * @return bool
     */
    public function isDisabled()
    {
        return !(boolean)Mage::getStoreConfig('pictureperfect/pictureperfect/enable');
    }

    /**
     * @param array $params
     *
     * @return string
     */
    public function getAdminFileUploadUrl(array $params = NULL)
    {
        return Mage::helper('adminhtml')->getUrl('adminhtml/pictureperfect/fileUpload', $params);
    }

    /**
     * if json is invalid returns false
     *
     * @param string $type
     *
     * @return bool|string
     */
    protected function _getJsonConfig($type)
    {
        $config = trim(Mage::getStoreConfig('pictureperfect/' . $type . '/config'));
        if (empty($config)) {
            return FALSE;
        }
        $decoded = json_decode($config);
        return $decoded instanceof stdClass ? rawurlencode($config) : FALSE;
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
     * @param Mage_Catalog_Helper_Image $catalogImage
     *
     * @return string
     */
    public function getImageWithHeight(Mage_Catalog_Helper_Image $catalogImage)
    {
        return $catalogImage->getOriginalWidth() . ' x ' . $catalogImage->getOriginalHeight() . 'px';
    }

    /**
     * Images Storage root directory
     *
     * @return string
     */
    public function getTempStorage()
    {
        return Mage::getBaseDir() . DS . 'var' . DS . 'pictureperfect' . DS;
    }

    /**
     * if php incorrect configured that upload_max_filesize > post_max_size
     * then return post_max_size
     *
     * @return int
     */
    public function getUploadMaxFileSize()
    {
        $return = $this->convertCfgVarToBytes(ini_get('upload_max_filesize'));
        $pms    = $this->getPostMaxSize();
        return $return > $pms ? $pms - 1 : $return;
    }

    /**
     * @return int
     */
    public function getPostMaxSize()
    {
        return $this->convertCfgVarToBytes(ini_get('post_max_size'));
    }

    /**
     * at least one upload must be allowed
     *
     * @return int
     */
    public function getMaxFileUploads()
    {
        $return = (int)ini_get('max_file_uploads');
        return $return < 1 ? 1 : $return;
    }

    /**
     * @param $val
     *
     * @return int
     */
    public function convertCfgVarToBytes($val)
    {
        $val = trim($val);
        if (empty($val)) {
            return 0;
        }

        preg_match('~([0-9]+)[\s]*([a-z]+)~i', $val, $matches);

        $last = '';
        if (isset($matches[2])) {
            $last = $matches[2];
        }

        if (isset($matches[1])) {
            $val = (int)$matches[1];
        }

        switch (substr(strtolower($last), 0, 1)) {
            case 'g':
                $val *= 1024;
            case 'm':
                $val *= 1024;
            case 'k':
                $val *= 1024;
        }

        return (int)$val;
    }
}