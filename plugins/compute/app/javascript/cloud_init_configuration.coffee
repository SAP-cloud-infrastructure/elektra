CloudInit = {}
CloudInit.automationBootstrap=(event) ->
  event.preventDefault()
  event.stopPropagation()
  button = $(event.target)
  action_path = $(event.target).data('automationScriptAction')

  os_image_option = $('#server_vmware_image_id option:selected')
  if $('#server_baremetal_image_id').val() != "" 
    os_image_option = $('#server_baremetal_image_id option:selected')
  
  CloudInit.checkOsType(button, os_image_option, action_path)

CloudInit.fetchLinuxScritp=(event) ->
  event.preventDefault()
  event.stopPropagation()
  button = $(event.target)
  action_path = button.data('automationScriptAction')
  $('a[data-toggle="windowsAutomationScript"]').addClass('disabled')
  CloudInit.startSpinner(button)
  CloudInit.fetchAutomationScript(button, 'linux', action_path)

CloudInit.fetchWindowsScritp=(event) ->
  event.preventDefault()
  event.stopPropagation()
  button = $(event.target)
  action_path = button.data('automationScriptAction')
  $('a[data-toggle="linuxAutomationScript"]').addClass('disabled')
  CloudInit.startSpinner(button)
  CloudInit.fetchAutomationScript(button, 'windows', action_path)

CloudInit.startSpinner = (button) ->
  icon = button.find('i.fa-plus')
  spinner = button.find('i.loading-spinner-button')
  icon.addClass('hide')
  spinner.removeClass('hide')
  button.addClass('disabled');

CloudInit.stopSpinner = (button) ->
  icon = button.find('i.fa-plus')
  spinner = button.find('i.loading-spinner-button')
  icon.removeClass('hide')
  spinner.addClass('hide')
  button.removeClass('disabled');

CloudInit.addEventListenerOnSelect= (button) ->
  $( "#server_vmware_image_id" ).unbind "change"
  $( "#server_vmware_image_id" ).bind "change", () -> CloudInit.removeOsTypeButtons()
  $( "#server_baremetal_image_id" ).unbind "change"
  $( "#server_baremetal_image_id" ).bind "change", () -> CloudInit.removeOsTypeButtons()

CloudInit.checkOsType = (button, os_image_option, action_path) ->

  os_image = os_image_option.data('vmwareOstype')

  # check empty image
  if os_image_option.val() == ""
    CloudInit.attachPopover(button, 'Error', "Please choose an image.")
    return
  # check image
  if os_image == "" || os_image == null || typeof os_image == "undefined"
    CloudInit.attachPopover(button, 'Warning', "Missing property 'vmware_ostype' on the image provided. Please follow the steps described in the documentation to upload a compatible image. <a href='https://documentation.global.cloud.sap/docs/customer/compute/os-image/customer-image/'>See customer images documentation</a>. Please choose manually.")
    CloudInit.addEventListenerOnSelect(button)
    CloudInit.addOsTypeButtons(button, action_path)

    return
  # get script
  $('a[data-toggle="windowsAutomationScript"]').addClass('disabled')
  CloudInit.startSpinner(button)
  CloudInit.fetchAutomationScript(button, os_image, action_path)

CloudInit.addOsTypeButtons = (button, action_path) ->
  CloudInit.removeOsTypeButtons()
  if button.attr('data-toggle') == 'CloudInit.automationBootstrap'
    button.before( '<span class="osTypeOptionButtons">' +
                      '<a href="#" class="btn btn-default btn-xs" data-toggle="linuxAutomationScript" data-automation-script-action="' + action_path + '">' +
                      '<i class="fa fa-plus fa-fw"></i><i class="loading-spinner-button hide"></i>Linux</a>' +
                      '<a href="#" class="btn btn-default btn-xs" data-toggle="windowsAutomationScript" data-automation-script-action="' + action_path + '">' +
                      '<i class="fa fa-plus fa-fw"></i><i class="loading-spinner-button hide"></i>Windows</a>' +
                    '</span>' );

CloudInit.removeOsTypeButtons = () ->
  $('.osTypeOptionButtons').remove()

CloudInit.fetchAutomationScript = (button, os_image, action_path) ->
  osImageJSON = new Object()
  osImageJSON.vmwareOstype = os_image
  $.ajax
    url: action_path,
    method: 'POST'
    dataType: 'json'
    data: JSON.stringify(osImageJSON)
    success: ( data, textStatus, jqXHR ) ->
      CloudInit.addScriptToUserAttributes(data.script, button, os_image)
    error: (xhr, bleep, error) ->
      CloudInit.attachPopover(button, 'Error', 'Something went wrong while processing your request. Please try again later.')
    complete: () ->
      CloudInit.stopSpinner(button)

CloudInit.addScriptToUserAttributes = (script, button, os_image) ->
  osTypeWindows = os_image.search("windows")
  userDataFieldText = $('#server_user_data').val()

  if !userDataFieldText.trim()
    # empty
    $('#server_user_data').val(script)
    CloudInit.removeOsTypeButtons()
  else
    # not empty
    if osTypeWindows >= 0
      # windows
      CloudInit.attachPopover(button, 'Error', "Bootstrapping the automation agent on windows can’t be combined with other user data.")
    else
      # linux
      if userDataFieldText.match("^#cloud-config")
        $('#server_user_data').val("#{$('#server_user_data').val()}\n\n#{script}")
        CloudInit.removeOsTypeButtons()
      else
        CloudInit.attachPopover(button, 'Error', "This doesn't semm to be a valid cloud config. Cloud config files starts with #cloud-config")

CloudInit.attachPopover = (element, title, body) ->
  element.find('.popover').remove()
  element.popover(
    title: title
    content: body
    html: true
    placement: "top"
  )
  element.popover('show')
  element.off('blur').on 'blur', ->
    element.popover('destroy')

$ ->
  $(document).on 'click','a[data-toggle="automationBootstrap"]', CloudInit.automationBootstrap
  $(document).on 'click','a[data-toggle="linuxAutomationScript"]', CloudInit.fetchLinuxScritp
  $(document).on 'click','a[data-toggle="windowsAutomationScript"]', CloudInit.fetchWindowsScritp
