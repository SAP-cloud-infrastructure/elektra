// Styleguide-specific JavaScript
// This file loads only Bootstrap's modal.js, not Elektra's custom modal

// Import jQuery (already loaded via application.js)
import $ from 'jquery'
window.jQuery = $
window.$ = $

// Import only Bootstrap's modal component
// We can't use the full bootstrap.js because application.js has custom modal.js
// So we'll reinitialize Bootstrap modal manually

// Manual Bootstrap Modal initialization
// Based on Bootstrap 3.4.1 modal.js behavior
(function() {
  'use strict'

  if (typeof $.fn.modal === 'undefined') {
    console.error('Bootstrap modal not available, trying to reinitialize')
  }

  // Listen for data-toggle="modal" clicks
  $(document).on('click.bs.modal.data-api', '[data-toggle="modal"]', function (e) {
    var $this = $(this)
    var href = $this.attr('href')
    var target = $this.attr('data-target') || (href && href.replace(/.*(?=#[^\s]+$)/, ''))
    var $target = $(target)

    console.log('Modal trigger clicked:', target)

    if ($target.length) {
      e.preventDefault()
      $target.modal('show')
    } else {
      console.error('Modal target not found:', target)
    }
  })

  console.log('Styleguide modal handlers initialized')
})()

// Debug helpers
window.testModal = function() {
  console.log('=== Modal Test ===')
  console.log('jQuery:', typeof $ !== 'undefined' ? $.fn.jquery : 'not loaded')
  console.log('Bootstrap modal:', typeof $.fn.modal !== 'undefined')
  console.log('Modals on page:', $('.modal').length)
  console.log('Modal buttons:', $('[data-toggle="modal"]').length)

  if (typeof $.fn.modal !== 'undefined') {
    console.log('Attempting to open modal...')
    $('#modal-default').modal('show')
  } else {
    alert('Bootstrap modal not available!')
  }
}

console.log('✅ Styleguide JavaScript loaded')
