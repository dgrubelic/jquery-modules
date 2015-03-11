(function (global, $) {
	'use strict';

	var initializedModules = {};

	$.fn.module = function (globalConfig) {
		var Module = {
			extend: function ($element, cfg) {
				var $rootElement = $element;

				var config = $.extend({}, {
					components: {},
					actions: {},
					events: {}

				}, cfg);

				var moduleCore = {},
					registredEvents = [];

				// Bind components
				$.each(config.components, function (component, selector) {
					switch($.type(selector)) {
						case 'string':
						case 'array':
							moduleCore['$' + component] = $rootElement.find(selector);
							break;
						case 'function': 
							moduleCore['$' + component] = selector.call(moduleCore);
							break;
						default:
							break;
					}
				});

				// Register events
				$.each(config.events, function (event, action) {
					var params = event.match(/^([\w]+)\(([^)]+)\)$/),
						eventType = params[1],
						selector = params[2];

					$rootElement.on(eventType, selector, function (e) {
						var $this = $(this);

						moduleCore.action(action, e, $this);
					});

					if (registredEvents.indexOf(eventType) === -1) {
						registredEvents.push(eventType);
					}
				});

				// Setup root element for module access
				moduleCore.$rootElement = $rootElement;

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
						$rootElement.off(eventType);
					});

					registredEvents = null;
					moduleCore = null;
					config = null;

					// And, in the end...clear root element
					$rootElement = null;
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

					$rootElement.trigger(eventName, args);
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
	
}(this, jQuery) /* Auto-invoking function */ );