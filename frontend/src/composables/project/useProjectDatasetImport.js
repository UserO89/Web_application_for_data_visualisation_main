import { ref } from 'vue'
import { projectsApi } from '../../api/projects'
import { extractApiErrorMessage } from '../../utils/api/errors'

export function useProjectDatasetImport({
  projectId,
  isReadOnly,
  manualError,
  prepareManualImportFile,
  setValidationReport,
  openValidationModal,
  loadProjectPage,
  notify,
  t,
  apiClient = projectsApi,
}) {
  const selectedFile = ref(null)
  const importing = ref(false)
  const importOptions = ref({ has_header: true, delimiter: ',' })
  const importMode = ref('file')

  const handleFileSelect = (event) => {
    selectedFile.value = event.target.files?.[0] || null
  }

  const afterDatasetImport = async (response) => {
    setValidationReport(response?.validation || null)
    await loadProjectPage()
    openValidationModal()
    notify.success(t('project.page.dataset.imported'))
  }

  const applyImportValidationError = (error) => {
    const validation = error?.response?.data?.validation
    if (!validation) return false

    setValidationReport(validation)
    openValidationModal()

    const validationMessage = validation?.blocking_error?.message
    notify.warning(validationMessage || t('project.page.dataset.importValidationIssues'))
    return true
  }

  const handleImport = async () => {
    if (isReadOnly.value) {
      notify.info(t('project.page.readOnly.importDisabled'))
      return
    }

    if (!selectedFile.value) {
      notify.warning(t('project.page.dataset.chooseFile'))
      return
    }

    importing.value = true
    manualError.value = ''

    try {
      const response = await apiClient.importDataset(projectId.value, selectedFile.value, importOptions.value)
      await afterDatasetImport(response)
    } catch (error) {
      if (!applyImportValidationError(error)) {
        notify.error(extractApiErrorMessage(error, t('project.page.dataset.importFailed')))
      }
    } finally {
      importing.value = false
    }
  }

  const handleManualImport = async () => {
    if (isReadOnly.value) {
      notify.info(t('project.page.readOnly.importDisabled'))
      return
    }

    const file = prepareManualImportFile()
    if (!file) return

    importing.value = true

    try {
      const response = await apiClient.importDataset(projectId.value, file, { has_header: true, delimiter: ',' })
      await afterDatasetImport(response)
    } catch (error) {
      if (applyImportValidationError(error)) {
        manualError.value = ''
      } else {
        manualError.value = extractApiErrorMessage(error, t('project.page.dataset.manualImportFailed'))
        notify.error(manualError.value)
      }
    } finally {
      importing.value = false
    }
  }

  return {
    selectedFile,
    importing,
    importOptions,
    importMode,
    handleFileSelect,
    handleImport,
    handleManualImport,
  }
}
