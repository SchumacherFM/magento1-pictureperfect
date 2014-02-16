<?php

/**
 * @category    SchumacherFM_PicturePerfect
 * @package     Helper
 * @author      Cyrill at Schumacher dot fm / @SchumacherFM
 * @copyright   Copyright (c) Please read the EULA
 */
class SchumacherFM_PicturePerfect_Helper_Data extends Mage_Core_Helper_Abstract
{
    const XML_CONFIG_ENABLE                        = 'catalog/pictureperfect/enable';
    const XML_CONFIG_LOWERCASE                     = 'catalog/pictureperfect/lowercase';
    const XML_CONFIG_GENERATE_LABEL                = 'catalog/pictureperfect/generate_label_from_file_name';
    const XML_CONFIG_FILENAME_TO_LABEL_REPLACEMENT = 'catalog/pictureperfect/filename_to_label_replacement';
    const XML_CONFIG_REWRITE_FILE_NAME             = 'catalog/pictureperfect/rewrite_file_name';
    const XML_CONFIG_REWRITE_FILE_NAME_MAP         = 'catalog/pictureperfect/rewrite_file_name_map';

    protected $_tempStorages = array();

    /**
     * @var Mage_Catalog_Model_Product
     */
    private $_currentProduct = NULL;

    /**
     * @var int
     */
    protected $_newFileNameMaxLength = 200;

    /**
     * @var string replace white space with that string
     */
    protected $_newFileNameWSReplacement = '-';

    /**
     * @param int|null $productId
     *
     * @return Mage_Catalog_Model_Product
     */
    public function getProduct($productId = NULL)
    {
        if (NULL === $productId || NULL !== $this->_currentProduct) {
            return $this->_currentProduct;
        }
        $this->_currentProduct = Mage::getModel('catalog/product')->load((int)$productId);
        return $this->_currentProduct;
    }

    /**
     * @todo if backend check for current selected store view / website
     *
     * check if MD is enabled ... per store view
     *
     * @return bool
     */
    public function isDisabled()
    {
        return !Mage::getStoreConfigFlag(self::XML_CONFIG_ENABLE);
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
     * Images Storage temp root directory
     *
     * @param string $subBaseDir
     *
     * @return mixed
     */
    public function getTempStorage($subBaseDir = '')
    {
        if (isset($this->_tempStorages[$subBaseDir])) {
            return $this->_tempStorages[$subBaseDir];
        }
        $this->_tempStorages[$subBaseDir] = Mage::getBaseDir('var') . DS . 'pictureperfect' . $subBaseDir . DS;
        $io                               = new Varien_Io_File();
        $io->checkAndCreateFolder($this->_tempStorages[$subBaseDir]);
        return $this->_tempStorages[$subBaseDir];
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

    /**
     * @param array  $tmpFileNames
     * @param string $newFileName
     * @param bool   $preDeleteTarget
     *
     * @return bool|string
     */
    public function mergeAndMove(array $tmpFileNames, $newFileName, $preDeleteTarget = TRUE)
    {
        $tempStorage = $this->getTempStorage();
        $fileName    = preg_replace('~[^\w\.\-_\(\)@#]+~i', '', $newFileName);
        Mage::log(['mergeAndMove', $tmpFileNames, $fileName]);

        if (TRUE === $preDeleteTarget) {
            @unlink($tempStorage . $fileName); // remove target before starting
        }

        foreach ($tmpFileNames as $tmpFile) {
            $result = $this->_mergeFile($tmpFile, $tempStorage . $fileName);
            if (FALSE === $result) {
                return FALSE;
            }
        }

        return $tempStorage . $fileName;
    }

    /**
     * @param $source
     * @param $target
     *
     * @return bool
     */
    protected function _mergeFile($source, $target)
    {
        if (!file_exists($source) || !is_file($source)) {
            return FALSE;
        }

        if (TRUE === $this->_isExecAvailable()) {
            // binary operation on possible really large files
            $this->_runExec('cat ' . escapeshellarg($source) . ' >> ' . escapeshellarg($target)); // . ' 2>&1'
            @unlink($source);
            return file_exists($target);
        } else {
            $written = file_put_contents($target, file_get_contents($source), FILE_APPEND);
            @unlink($source);
            if (FALSE === $written) {
                return FALSE;
            }
        }
        return TRUE;
    }

    /**
     * @param string $cmd
     */
    protected function _runExec($cmd)
    {
        $result = shell_exec($cmd);
    }

    /**
     * @return bool
     */
    protected function _isExecAvailable()
    {
        if (ini_get('safe_mode')) {
            $available = FALSE;
        } else {
            $cfg       = ini_get('disable_functions') . ',' . ini_get('suhosin.executor.func.blacklist');
            $array     = array_flip(preg_split('~\s*,\s*~', $cfg, NULL, PREG_SPLIT_NO_EMPTY));
            $available = !isset($array['shell_exec']);
        }
        return $available;
    }

    /**
     * @param $fileName
     *
     * @return string
     */
    public function rewriteFileNameWithProductAttributes($fileName)
    {
        if (FALSE === Mage::getStoreConfigFlag(self::XML_CONFIG_REWRITE_FILE_NAME)) {
            return $fileName;
        }
        $product = $this->getProduct();
        $map     = trim(Mage::getStoreConfig(self::XML_CONFIG_REWRITE_FILE_NAME_MAP));

        $rewriteMap = array();
        foreach ($product->getData() as $attribute => $value) {
            if (is_string($value) || is_numeric($value)) {
                $rewriteMap['%' . $attribute] = $value;
            }
        }
        $extension   = strtolower(Varien_File_Object::getExt($fileName));
        $newFileName = str_replace(array_keys($rewriteMap), $rewriteMap, $map);
        $newFileName = trim(preg_replace('~[^0-9a-z_\-@]+~i', $this->_newFileNameWSReplacement, $newFileName), $this->_newFileNameWSReplacement);
        $newFileName = substr($newFileName, 0, $this->_newFileNameMaxLength);

        if (TRUE === Mage::getStoreConfigFlag(self::XML_CONFIG_LOWERCASE)) {
            $newFileName = strtolower($newFileName);
        }
        return $this->_generateUniqueFileName($newFileName) . '.' . $extension;
    }

    /**
     * @param $newFileName
     *
     * @return mixed
     */
    protected function _generateUniqueFileName($newFileName)
    {
        $product = $this->getProduct();
        $gallery = $product->getData('media_gallery');
        return FALSE === is_array($gallery)
            ? $newFileName
            : $newFileName . '-' . count($gallery['images']);
    }

    /**
     * @return array|string success array and on error a string
     */
    public function getUploadedFilesNames()
    {
        if (empty($_FILES) || !isset($_FILES['binaryData']) || empty($_FILES['binaryData']) || !is_array($_FILES['binaryData']['name'])) {
            Mage::log(array('_getUploadedFilesNames', $_FILES, $_GET, $_POST));
            return $this->__('No file found that should have been uploaded');
        }

        /**
         * Varien_File_Uploader cannot handle arrays ... like we are using here
         */
        $tempStorage = $this->getTempStorage();
        $fileNames   = array();
        foreach ($_FILES['binaryData']['error'] as $index => $error) {
            if ($error !== UPLOAD_ERR_OK) {
                return $this->__('An upload error occurred for file: ' . $_FILES['binaryData']['name'][$index]);
            }

            $res = move_uploaded_file($_FILES['binaryData']['tmp_name'][$index], $tempStorage . $_FILES['binaryData']['name'][$index]);
            if (FALSE === $res) {
                return $this->__('An upload error occurred during moving for file: ' . $_FILES['binaryData']['name'][$index]);
            }
            $fileNames[] = $tempStorage . $_FILES['binaryData']['name'][$index];
        } //endForeach
        return $fileNames;
    }

    /**
     * when multiple requests happen this method gets all the finished uploaded files
     * moves them to a special dir
     * so we can avoid storing in the users session how many files already have been uploaded
     * that is maybe a little bit not optimal due to opening DIR and reading
     *
     * @param string $uniqueFileNamePrefix
     * @param int    $bdTotalFiles
     *
     * @return array
     */
    public function getAlreadyUploadedFileChunks($uniqueFileNamePrefix, $bdTotalFiles)
    {
        $readDir    = $this->getTempStorage();
        $globSearch = $readDir . $uniqueFileNamePrefix . '*.bin';
        $chunkFiles = glob($globSearch, GLOB_NOSORT);

        /*
        if ($bdTotalFiles === count($chunkFiles)) {
            $moveToDir = $this->getTempStorage('_merge');
            if ($this->_isExecAvailable()) {
                $this->_runExec('mv ' . $globSearch . ' ' . $moveToDir);
                $chunkFiles = glob($moveToDir . $uniqueFileNamePrefix . '*.bin', GLOB_NOSORT); // get new file location
            } else {
                foreach ($chunkFiles as &$file) {
                    $renamed = rename($file, $moveToDir . basename($file));
                    if (FALSE === $renamed) {
                        Mage::log(array('Error: getAlreadyUploadedFileChunks cannot move files', $chunkFiles, $moveToDir));
                        return array();
                    }
                    $file = str_replace($readDir, $moveToDir, $file); // rename files to new dir
                }
            }
        } */

        return $chunkFiles;
    }

    /**
     * extracts the unique part
     *
     * @param array $tmpFileNames
     *
     * @return string|bool
     */
    public function getUploadFileBaseName(array $tmpFileNames)
    {
        $file    = current($tmpFileNames);
        $matches = array();
        preg_match('~/(pp_[a-z0-9]{5,})__~', $file, $matches);
        return isset($matches[1]) ? $matches[1] : FALSE;
    }
}