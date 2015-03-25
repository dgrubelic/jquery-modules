# jquery-modules
Simple modules plugin that gives your jQuery code structure you never had.

## jQuery-modules features
1. Shared service objects
2. Encapsulated module jQuery root element as a container for all events and components
3. Automatically cache component objects to module
4. Define module actions available for events and module internal usage
5. Define module events with automatic bind/unbind.

## Usage

```js
$(document).ready(function () {
  $(document).module({
    services: {
      helpers: {
        parseTaskName: function (name) {
          // Do some parsing...
          return name;
        }
      },
      
      taskRepository: {
        find: function (id) {},
        list: function (params) {},
        create: function (data) {},
        update: function (task) {},
        delete: function (task) {}
      }
    }
  })
  $("#app").module({
    init: function () {
      // Do your module initialization magic here... :)
    },
    
    // Search for all jQuery objects in module root and store the to the module object.
    // All components will be stored in the module object with "$" prefix.
    components: {
      input: 'input#task-input'
    },
    
    // Services can be reused in other registred modules.
    services: {
      helpers: 'helpers',
      taskRepository: 'taskRepository'
    },
    
    actions: {
      createTask: function () {
        var task = this.taskRepository.create({
          name: this.helper.parseTaskName(this.$input.val())
        });
        
        // Call action and pass parameters
        this.action('updateTaskList', task);
      },
      
      updateTaskList: function (task) {
        // Update task list view
      }
    },
    
    events: {
      // Event type ( selector ) : handler action
      'click(#createTask)': 'createTask'
    }
  });
});
