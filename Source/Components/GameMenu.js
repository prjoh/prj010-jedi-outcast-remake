import { ecs_component } from '../ECS/Component';

export const component_game_menu = (() => {

  const game_menu = document.getElementById('game-menu');

  class UI_GameMenu extends ecs_component.Component
  {
    static CLASS_NAME = 'UI_GameMenu';

    get NAME() {
      return UI_GameMenu.CLASS_NAME;
    }

    constructor(params)
    {
      super();

      this.is_shown_ = false;
    }

    get is_shown()
    {
      return this.is_shown_;
    }

    on_initialized()
    {
    }

    show()
    {
      if (this.is_shown_ === true)
      {
        return;
      }
      this.is_shown_ = true;
      game_menu.classList.add('show');
    }

    hide()
    {
      if (this.is_shown_ === false)
      {
        return;
      }
      this.is_shown_ = false;
      game_menu.classList.remove("show");
    }
  };

  return {
    UI_GameMenu: UI_GameMenu,
  };

})();
