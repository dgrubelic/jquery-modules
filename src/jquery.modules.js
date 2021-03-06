(function (window, document, $) {
  'use strict';

  function generateUUID(){
      var d = new Date().getTime();
      var uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
          var r = (d + Math.random()*16)%16 | 0;
          d = Math.floor(d/16);
          return (c=='x' ? r : (r&0x3|0x8)).toString(16);
      });

      return uuid;
  };

  function deepCopy(obj) {
      if(obj == null || typeof(obj) != 'object')
          return obj;

      var temp = obj.constructor(); // changed

      for(var key in obj) {
          if(obj.hasOwnProperty(key)) {
              temp[key] = clone(obj[key]);
          }
      }

      return temp;
  }

  var publicApi = ['trigger', 'pause', 'destroy'];
  var forbidenNames = ['action', 'destroy', 'init', 'trigger'];
  var allowedActionParamTypes = ['string', 'array'];

  var serviceInstances = {};

  var Module = {
    extend: function ($element, cfg) {
      var config = $.extend({}, {
        components: {
          'window': window,
          'document': document
        },
        actions:  {},
        events:   {},
        services: {}
      }, cfg);

      var isPaused = false;

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

      $.each(config.services, function (service, construct) {
        if (forbidenNames[service]) return;

        // We are using existing service
        if ($.type(construct) === 'string') {
          var serviceInstance = serviceInstances[construct];

          if (serviceInstance) {
            if ($.type(serviceInstance) === 'object') {
              moduleCore[service] = serviceInstance;
            } else if ($.type(serviceInstance) === 'function') {
              moduleCore[service] = serviceInstance();
            }
           }

        } else if ($.type(construct) === 'object') {
          // Cache new service instance
          if (!serviceInstances[service]) {
            serviceInstances[service] = construct;
          }

          moduleCore[service] = construct;

        } else if ($.type(construct) === 'function') {
          if (!serviceInstances[service]) {
            serviceInstances[service] = construct;
          }

          moduleCore[service] = construct();
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

        moduleCore.$el.on(eventType, selector, function (e) {
          if (isPaused) {
            e.preventDefault();
            e.stopPropagation();
            e.stopImmediatePropagation();
            return false;
          }

          var $this = $(this);

          if ($.type(action) === 'array') {
            $.each(action, function (index, actionName) {
              return moduleCore.action(actionName, e, $this);
            });
          } else if ($.type(action) === 'string') {
            return moduleCore.action(action, e, $this);
          }
        });

        if (registredEvents[eventType]) {
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

      moduleCore.pause = function (paused) {
        if (isPaused !== paused) {
          isPaused = paused;
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
        if (isPaused) return;

        var actionName = arguments[0],
          args = [].slice.call(arguments, 1, arguments.length);

        if (config.actions[actionName] && config.actions[actionName].apply) {
          return config.actions[actionName].apply(moduleCore, args);
        }
      };

      moduleCore.trigger = function () {
        if (isPaused) return moduleCore;

        var eventName = arguments[0],
          args = Array.prototype.splice.call(arguments, 1);

        if (eventName) {
          moduleCore.$el.trigger(eventName, args);
        }
        return moduleCore;
      };

      return moduleCore;
    }
  };

  var moduleInstances = { /* uuid:module instance */ };
  $.fn.module = function (moduleConfig, options) {
    var pluginArguments = arguments;

    // Call api method
    if ($.type(moduleConfig) === 'string') {
      if (!publicApi[moduleConfig]) return this;

      this.each(function () {
        var $this = $(this);

        var instance = moduleInstances[$this.data('uuid')];
        if (instance && $.type(instance[moduleConfig]) === 'function') {
          var args = [];

          if (moduleConfig === 'pause') {
            args.push(!!options);
          } else if (moduleConfig === 'trigger') {
            args = Array.prototype.slice.call(pluginArguments, 1);
          }
          
          instance[moduleConfig].apply(instance, args);

          if (moduleConfig === 'destroy') {
            moduleInstances[$this.data('uuid')] = undefined;
            $this.data('uuid', null);
          }
        }
      });

      return this;
    }

    this.each(function () {
      var $element = $(this);
      var uuid, instance;

      if ($element.data('uuid')) {
        uuid = $element.data('uuid');
        instance = moduleInstances[uuid];
      } else {
        uuid = generateUUID();
        instance = moduleInstances[uuid] = Module.extend($element, moduleConfig);
        instance.init();

        $element.data('uuid', uuid);
      }
    });

    return this;
  };
  
}(this, this.document, jQuery) /* Auto-invoking function */ );