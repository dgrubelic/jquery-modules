(function (window, document, $) {
  'use strict';

  var initializedModules = {};

  $.fn.module = function (globalConfig) {
    var Module = {
      extend: function ($element, cfg) {
        var config = $.extend({}, {
          components: {
            'window': window,
            'document': document
          },
          actions: {},
          events: {}
        }, cfg);

        var moduleCore = {},
            registredEvents = [];

        // Setup root element for module access
        moduleCore.$el = $element;

        // Add global data container
        moduleCore.data = {};

        // Bind components
        $.each(config.components, function (component, selector) {
          if (component === 'el') return;

          switch($.type(selector)) {
            case 'string':
            case 'array':
              moduleCore['$' + component] = moduleCore.$el.find(selector);
              break;
            case 'function': 
              moduleCore['$' + component] = selector.call(moduleCore.$el);
              break;
            default:
              break;
          }
        });

        // Register events
        $.each(config.events, function (event, action) {
          var params = event.match(/^([\w]+)\(([^)]+)\)$/);

          var eventType = null,
              selector;

          if ($.type(params) === 'array' && params.length >= 2) {
            eventType = params[1];
            selector = params[2];
          } else {
            eventType = event;
          }

          if (['string', 'array'].indexOf($.type(action)) === -1) {
            throw "Unsupported event action parameter";
          }

          moduleCore.$el.on(eventType, selector, function (e) {
            var $this = $(this);

            if ($.type(action) === 'array') {
              $.each(action, function (index, actionName) {
                moduleCore.action(actionName, e, $this);
              });
            } else if ($.type(action) === 'string') {
              moduleCore.action(action, e, $this);
            }
          });

          if (registredEvents.indexOf(eventType) === -1) {
            registredEvents.push(eventType);
          }
        });

        moduleCore.init = function () {
          if ($.type(config.init) === 'function') {
            config.init.call(moduleCore);
            delete moduleCore.init;
          }
        };

        moduleCore.destroy = function () {
          if ($.type(config.destroy) === 'function') {
            config.destroy.call(moduleCore);
            delete moduleCore.destroy;
          }

          $.each(registredEvents, function (eventType) {
            moduleCore.$el.off(eventType);
          });

          registredEvents = null;
          moduleCore = null;
          config = null;
        };

        moduleCore.action = function () {
          var actionName = arguments[0],
            args = Array.prototype.splice.call(arguments, 1);

          if (config.actions[actionName] && config.actions[actionName].apply) {
            config.actions[actionName].apply(moduleCore, args);
          }
        };

        moduleCore.trigger = function () {
          var eventName = arguments[0],
            args = Array.prototype.splice.call(arguments, 1);

          moduleCore.$el.trigger(eventName, args);
        };

        moduleCore.digest = function () {
          throw "Not implemented!";
        };

        return moduleCore;
      }
    };

    var selector = this.selector;

    if (!initializedModules[selector]) {
      initializedModules[selector] = [];
    }

    this.each(function () {
      var $this = $(this);

      if (globalConfig === 'destroy') {
        $.map(initializedModules[selector], function (module) {
          module.destroy();
        });

        initializedModules[selector].length = 0;
      } else {
        var module = Module.extend($this, globalConfig);
        module.init();

        initializedModules[selector].push(module);
      }
    });
  };
  
}(this, this.document, jQuery) /* Auto-invoking function */ );