import { Pane } from 'tweakpane';

import { ecs_component } from '../ECS/Component';
import { assert } from '../Assert';

export const component_editor = (() => {

  const eEditorPage = Object.freeze({
    EP_Profiling: 0,
    EP_DebugDraw: 1,
    EP_Lighting: 2,
    EP_PostFX: 3,
  });

  const editor_page_definitions = [
    {title: 'Profiling'},
    {title: 'Debug Draw'},
    {title: 'Lighting'},
    {title: 'PostFX'},
  ];

  class EditorPage
  {
    constructor(page_name, page_obj)
    {
      this.name = page_name;
      this.page_obj_ = page_obj;
      this.folders_ = new Map();
    }

    create_folder(folder_name, is_expanded = true)
    {
      assert(this.folders_.has(folder_name) === false);

      const folder = this.page_obj_.addFolder({
        title: folder_name,
        expanded: is_expanded,
      });
      this.folders_.set(folder_name, folder);

      return folder;
    }

    add_folder_binding(folder_name, object_reference, value_key, label, binding_config, callback)
    {
      assert(this.folders_.has(folder_name));

      let folder = this.folders_.get(folder_name);

      const label_config = { label: label };
      binding_config = binding_config ? { ...label_config, ...binding_config } : label_config;

      folder.addBinding(object_reference, value_key, binding_config)
        .on('change', (ev) => {
          if (callback !== undefined)
          {
            callback(ev.value);
          }
        });
    }

    add_binding(object_reference, value_key, label, binding_config, callback)
    {
      assert(value_key in object_reference);

      const label_config = { label: label };
      binding_config = binding_config ? { ...label_config, ...binding_config } : label_config;

      this.page_obj_.addBinding(object_reference, value_key, binding_config)
        .on('change', (ev) => {
          if (callback !== undefined)
          {
            callback(ev.value);
          }
        });
    }
  };

  class EditorComponent extends ecs_component.Component
  {
    static CLASS_NAME = 'EditorComponent';

    get NAME() {
      return EditorComponent.CLASS_NAME;
    }

    constructor()
    {
      super();

      this.pane_ = new Pane({
        expanded: true,
        title: "Editor",
      });

      this.editor_pages_ = [];

      this.editor_tab_ = this.pane_.addTab({
        pages: editor_page_definitions,
      });

      for (let i = 0; i < editor_page_definitions.length; ++i)
      {
        const page_name = editor_page_definitions[i].title;
        const page_obj = this.editor_tab_.pages[i];
        this.editor_pages_.push(new EditorPage(page_name, page_obj));
      }
    }

    destroy()
    {
      this.pane_.dispose();

      super.destroy();
    }

    get_page(editor_page)
    {
      assert(Object.values(eEditorPage).includes(editor_page));
      return this.editor_pages_[editor_page];
    }
  };

  return {
    EditorComponent: EditorComponent,
    eEditorPage: eEditorPage,
  };

})();
