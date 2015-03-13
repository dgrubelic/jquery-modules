(function (window, document, $) {
  'use strict';

  var initializedModules = {};

  var forbidenMethods = ['action', 'destroy', 'init', 'trigger'];

  $.fn.module = function (globalConfig, options) {
    var pluginOptions = {};

    if ($.type(options) === 'boolean') {
      options = {
        singleton: options
      };
    }

    pluginOptions = $.extend({}, {
      singleton: false
    }, options);

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
                return moduleCore.action(actionName, e, $this);
              });
            } else if ($.type(action) === 'string') {
              return moduleCore.action(action, e, $this);
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

          return moduleCore;
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
            return config.actions[actionName].apply(moduleCore, args);
          }
        };

        moduleCore.trigger = function () {
          var eventName = arguments[0],
            args = Array.prototype.splice.call(arguments, 1);

          moduleCore.$el.trigger(eventName, args);
          return moduleCore;
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

    if (pluginOptions.singleton) {
      if (globalConfig === 'destroy') {
        if (initializedModules[selector]) {
          initializedModules[selector].destroy();
          delete initializedModules[selector];
        }
      } else {
        if (!initializedModules[selector]) {
          var module = initializedModules[selector] = Module.extend(this, globalConfig);
          module.init();
        } else {
          throw "Hey, you are trying to re-initialize singleton module. This is no-no!";
        }
      }
    } else {
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
    }

    return this;
  };
  
}(this, this.document, jQuery) /* Auto-invoking function */ );