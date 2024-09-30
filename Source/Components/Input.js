import * as THREE from 'three';

import { ecs_component } from '../ECS/Component';
import { assert } from '../Assert';
import { log } from '../Log';


const eKeyboardKey = Object.freeze({
  KK_None:            0,        // Key: None, used for no key pressed
  // Alphanumeric keys
  KK_Apostrophe:      1,       // Key: '
  KK_Comma:           2,       // Key: ,
  KK_Minus:           3,       // Key: -
  KK_Period:          4,       // Key: .
  KK_Slash:           5,       // Key: /
  KK_Zero:            6,       // Key: 0
  KK_One:             7,       // Key: 1
  KK_Two:             8,       // Key: 2
  KK_Three:           9,       // Key: 3
  KK_Four:            10,       // Key: 4
  KK_Five:            11,       // Key: 5
  KK_Six:             12,       // Key: 6
  KK_Seven:           13,       // Key: 7
  KK_Eight:           14,       // Key: 8
  KK_Nine:            15,       // Key: 9
  KK_Semicolon:       16,       // Key: ;
  KK_Equal:           17,       // Key: =
  KK_A:               18,       // Key: A | a
  KK_B:               19,       // Key: B | b
  KK_C:               20,       // Key: C | c
  KK_D:               21,       // Key: D | d
  KK_E:               22,       // Key: E | e
  KK_F:               23,       // Key: F | f
  KK_G:               24,       // Key: G | g
  KK_H:               25,       // Key: H | h
  KK_I:               26,       // Key: I | i
  KK_J:               27,       // Key: J | j
  KK_K:               28,       // Key: K | k
  KK_L:               29,       // Key: L | l
  KK_M:               30,       // Key: M | m
  KK_N:               31,       // Key: N | n
  KK_O:               32,       // Key: O | o
  KK_P:               33,       // Key: P | p
  KK_Q:               34,       // Key: Q | q
  KK_R:               35,       // Key: R | r
  KK_S:               36,       // Key: S | s
  KK_T:               37,       // Key: T | t
  KK_U:               38,       // Key: U | u
  KK_V:               39,       // Key: V | v
  KK_W:               40,       // Key: W | w
  KK_X:               41,       // Key: X | x
  KK_Y:               42,       // Key: Y | y
  KK_Z:               43,       // Key: Z | z
  KK_LeftBracket:     44,       // Key: [
  KK_Backslash:       45,       // Key: '\'
  KK_RightBracket:    46,       // Key: ]
  KK_Grave:           47,       // Key: `
  // Function keys
  KK_Space:           48,       // Key: Space
  KK_Escape:          49,      // Key: Esc
  KK_Enter:           50,      // Key: Enter
  KK_Tab:             51,      // Key: Tab
  KK_Backspace:       52,      // Key: Backspace
  KK_Insert:          53,      // Key: Ins
  KK_Delete:          54,      // Key: Del
  KK_Right:           55,      // Key: Cursor right
  KK_Left:            56,      // Key: Cursor left
  KK_Down:            57,      // Key: Cursor down
  KK_Up:              58,      // Key: Cursor up
  KK_PageUp:         59,      // Key: Page up
  KK_PageDown:       60,      // Key: Page down
  KK_Home:            61,      // Key: Home
  KK_End:             62,      // Key: End
  KK_CapsLocks:       63,      // Key: Caps lock
  KK_ScrollLock:     64,      // Key: Scroll down
  KK_NumLock:        65,      // Key: Num lock
  KK_PrintScreen:    66,      // Key: Print screen
  KK_Pause:           67,      // Key: Pause
  KK_F1:              68,      // Key: F1
  KK_F2:              69,      // Key: F2
  KK_F3:              70,      // Key: F3
  KK_F4:              71,      // Key: F4
  KK_F5:              72,      // Key: F5
  KK_F6:              73,      // Key: F6
  KK_F7:              74,      // Key: F7
  KK_F8:              75,      // Key: F8
  KK_F9:              76,      // Key: F9
  KK_F10:             77,      // Key: F10
  KK_F11:             78,      // Key: F11
  KK_F12:             79,      // Key: F12
  KK_LeftShift:      80,      // Key: Shift left
  KK_LeftControl:    81,      // Key: Control left
  KK_LeftAlt:        82,      // Key: Alt left
  KK_LeftSuper:      83,      // Key: Super left
  KK_RightShift:     84,      // Key: Shift right
  KK_RightControl:   85,      // Key: Control right
  KK_RightAlt:       86,      // Key: Alt right
  KK_RightSuper:     87,      // Key: Super right
  KK_KBMenu:         88,      // Key: KB menu
  // Keypad keys
  KK_KeyPad0:            89,      // Key: Keypad 0
  KK_KeyPad1:            90,      // Key: Keypad 1
  KK_KeyPad2:            91,      // Key: Keypad 2
  KK_KeyPad3:            92,      // Key: Keypad 3
  KK_KeyPad4:            93,      // Key: Keypad 4
  KK_KeyPad5:            94,      // Key: Keypad 5
  KK_KeyPad6:            95,      // Key: Keypad 6
  KK_KeyPad7:            96,      // Key: Keypad 7
  KK_KeyPad8:            97,      // Key: Keypad 8
  KK_KeyPad9:            98,      // Key: Keypad 9
  KK_KeyPadDecimal:      99,      // Key: Keypad .
  KK_KeyPadDivide:       100,      // Key: Keypad /
  KK_KeyPadMultiply:     101,      // Key: Keypad *
  KK_KeyPadSubtract:     102,      // Key: Keypad -
  KK_KeyPadAdd:          103,      // Key: Keypad +
  KK_KeyPadEnter:        104,      // Key: Keypad Enter
  KK_KeyPadEqual:        105,      // Key: Keypad =
  // Android key buttons
  KK_Back:            106,        // Key: Android back button
  KK_Menu:            107,       // Key: Android menu button
  KK_VolumeUp:       108,       // Key: Android volume up button
  KK_VolumeDown:     109        // Key: Android volume down button
});

const eMouseButton = Object.freeze({
  MB_Left:     0,       // Mouse button left
  MB_Middle:   1,       // Mouse button middle (pressed wheel)
  MB_Right:    2,       // Mouse button right
  MB_Back:     3,       // Mouse button back (advanced mouse device)
  MB_Forward:  4,       // Mouse button forward (advanced mouse device)
});

export { eKeyboardKey, eMouseButton };

export const component_input = (() => {

  const MAX_KEYBOARD_KEYS = 128;
  const MAX_KEY_PRESSED_QUEUE = 16;

  const MAX_MOUSE_BUTTONS = 5;
  // const MAX_TOUCH_POINTS = 8;

  // const MAX_GAMEPAD_AXIS = 8;
  // const MAX_GAMEPAD_BUTTONS = 32;

  const KeyboardEventKeys = Object.freeze({
      'Unidentified': 0,       // KK_None
      "'": 1,                  // KK_Apostrophe
      ',': 2,                  // KK_Comma
      '-': 3,                  // KK_Minus
      '.': 4,                  // KK_Period
      '/': 5,                  // KK_Slash
      '0': 6,                  // KK_Zero
      '1': 7,                  // KK_One
      '2': 8,                  // KK_Two
      '3': 9,                  // KK_Three
      '4': 10,                 // KK_Four
      '5': 11,                 // KK_Five
      '6': 12,                 // KK_Six
      '7': 13,                 // KK_Seven
      '8': 14,                 // KK_Eight
      '9': 15,                 // KK_Nine
      ';': 16,                 // KK_Semicolon
      '=': 17,                 // KK_Equal
      'a': 18,                 // KK_A
      'b': 19,                 // KK_B
      'c': 20,                 // KK_C
      'd': 21,                 // KK_D
      'e': 22,                 // KK_E
      'f': 23,                 // KK_F
      'g': 24,                 // KK_G
      'h': 25,                 // KK_H
      'i': 26,                 // KK_I
      'j': 27,                 // KK_J
      'k': 28,                 // KK_K
      'l': 29,                 // KK_L
      'm': 30,                 // KK_M
      'n': 31,                 // KK_N
      'o': 32,                 // KK_O
      'p': 33,                 // KK_P
      'q': 34,                 // KK_Q
      'r': 35,                 // KK_R
      's': 36,                 // KK_S
      't': 37,                 // KK_T
      'u': 38,                 // KK_U
      'v': 39,                 // KK_V
      'w': 40,                 // KK_W
      'x': 41,                 // KK_X
      'y': 42,                 // KK_Y
      'z': 43,                 // KK_Z
      '[': 44,                 // KK_LeftBracket
      '\\': 45,                // KK_Backslash
      ']': 46,                 // KK_RightBracket
      '`': 47,                 // KK_Grave
      ' ': 48,                 // KK_Space
      'Escape': 49,            // KK_Escape
      'Enter': 50,             // KK_Enter
      'Tab': 51,               // KK_Tab
      'Backspace': 52,         // KK_Backspace
      'Insert': 53,            // KK_Insert
      'Delete': 54,            // KK_Delete
      'ArrowRight': 55,        // KK_Right
      'ArrowLeft': 56,         // KK_Left
      'ArrowDown': 57,         // KK_Down
      'ArrowUp': 58,           // KK_Up
      'PageUp': 59,            // KK_PageUp
      'PageDown': 60,          // KK_PageDown
      'Home': 61,              // KK_Home
      'End': 62,               // KK_End
      'CapsLock': 63,          // KK_CapsLock
      'ScrollLock': 64,        // KK_ScrollLock
      'NumLock': 65,           // KK_NumLock
      'PrintScreen': 66,       // KK_PrintScreen
      'Pause': 67,             // KK_Pause
      'F1': 68,                // KK_F1
      'F2': 69,                // KK_F2
      'F3': 70,                // KK_F3
      'F4': 71,                // KK_F4
      'F5': 72,                // KK_F5
      'F6': 73,                // KK_F6
      'F7': 74,                // KK_F7
      'F8': 75,                // KK_F8
      'F9': 76,                // KK_F9
      'F10': 77,               // KK_F10
      'F11': 78,               // KK_F11
      'F12': 79,               // KK_F12
      'Shift': 80,             // KK_LeftShift (assuming generic "Shift" key for both sides)
      'Control': 81,           // KK_LeftControl (assuming generic "Control" key for both sides)
      'Alt': 82,               // KK_LeftAlt (assuming generic "Alt" key for both sides)
      'Meta': 83,              // KK_LeftSuper (assuming generic "Meta" key for both sides)
      'ContextMenu': 88,       // KK_KBMenu
      'Num0': 89,              // KK_KeyPad0
      'Num1': 90,              // KK_KeyPad1
      'Num2': 91,              // KK_KeyPad2
      'Num3': 92,              // KK_KeyPad3
      'Num4': 93,              // KK_KeyPad4
      'Num5': 94,              // KK_KeyPad5
      'Num6': 95,              // KK_KeyPad6
      'Num7': 96,              // KK_KeyPad7
      'Num8': 97,              // KK_KeyPad8
      'Num9': 98,              // KK_KeyPad9
      'NumDecimal': 99,        // KK_KeyPadDecimal
      'NumDivide': 100,        // KK_KeyPadDivide
      'NumMultiply': 101,      // KK_KeyPadMultiply
      'NumSubtract': 102,      // KK_KeyPadSubtract
      'NumAdd': 103,           // KK_KeyPadAdd
      'NumEnter': 104,         // KK_KeyPadEnter
      'NumEqual': 105,         // KK_KeyPadEqual
      'Back': 106,             // KK_Back (Android back button)
      'Menu': 107,             // KK_Menu (Android menu button)
      'VolumeUp': 108,         // KK_VolumeUp (Android volume up button)
      'VolumeDown': 109        // KK_VolumeDown (Android volume down button)
  });

  // const eMouseCursor = Object.freeze({
  //   MC_CursorDefault:      0,   // Default pointer shape
  //   MC_CursorArrow:        1,   // Arrow shape
  //   MC_CursorIBeam:        2,   // Text writing cursor shape
  //   MC_CursorCrosshair:    3,   // Cross shape
  //   MC_CursorPointingHand: 4,   // Pointing hand cursor
  //   MC_CursorResizeEW:     5,   // Horizontal resize/move arrow shape
  //   MC_CursorResizeNS:     6,   // Vertical resize/move arrow shape
  //   MC_CursorResizeNWSE:   7,   // Top-left to bottom-right diagonal resize/move arrow shape
  //   MC_CursorResizeNESW:   8,   // The top-right to bottom-left diagonal resize/move arrow shape
  //   MC_CursorResizeAll:    9,   // The omnidirectional resize/move cursor shape
  //   MC_CursorNotAllowed:   10,  // The operation-not-allowed shape
  // });

  // const eGamepadButton = Object.freeze({
  //   GB_Unknown:         0,   // Unknown button, just for error checking
  //   GB_LeftFaceUp:      1,   // Gamepad left DPAD up button
  //   GB_LeftFaceRight:   2,   // Gamepad left DPAD right button
  //   GB_LeftFaceDown:    3,   // Gamepad left DPAD down button
  //   GB_LeftFaceLeft:    4,   // Gamepad left DPAD left button
  //   GB_RightFaceUp:     5,   // Gamepad right button up (i.e. PS3: Triangle, Xbox: Y)
  //   GB_RightFaceRight:  6,   // Gamepad right button right (i.e. PS3: Square, Xbox: X)
  //   GB_RightFaceDown:   7,   // Gamepad right button down (i.e. PS3: Cross, Xbox: A)
  //   GB_RightFaceLeft:   8,   // Gamepad right button left (i.e. PS3: Circle, Xbox: B)
  //   GB_LeftTrigger1:    9,   // Gamepad top/back trigger left (first), it could be a trailing button
  //   GB_LeftTrigger2:    10,  // Gamepad top/back trigger left (second), it could be a trailing button
  //   GB_RightTrigger1:   11,  // Gamepad top/back trigger right (one), it could be a trailing button
  //   GB_RightTrigger2:   12,  // Gamepad top/back trigger right (second), it could be a trailing button
  //   GB_MiddleLeft:      13,  // Gamepad center buttons, left one (i.e. PS3: Select)
  //   GB_Middle:          14,  // Gamepad center buttons, middle one (i.e. PS3: PS, Xbox: XBOX)
  //   GB_MiddleRight:     15,  // Gamepad center buttons, right one (i.e. PS3: Start)
  //   GB_LeftThumb:       16,  // Gamepad joystick pressed button left
  //   GB_RightThumb:      17   // Gamepad joystick pressed button right
  // });

  // const eGamepadAxis = Object.freeze({
  //   GA_LeftX:         0,     // Gamepad left stick X axis
  //   GA_LeftY:         1,     // Gamepad left stick Y axis
  //   GA_RightX:        2,     // Gamepad right stick X axis
  //   GA_RightY:        3,     // Gamepad right stick Y axis
  //   GA_LeftTrigger:   4,     // Gamepad back trigger left, pressure level: [1..-1]
  //   GA_RightTrigger:  5      // Gamepad back trigger right, pressure level: [1..-1]
  // });

  class InputComponent extends ecs_component.Component
  {
    static CLASS_NAME = 'InputComponent';

    get NAME() {
      return InputComponent.CLASS_NAME;
    }

    constructor()
    {
      super();

      this.canvas_ = document.getElementById('canvas');

      this.keyboard = {
        // exit_key: 0,
        previous_key_state: new Array(MAX_KEYBOARD_KEYS).fill(false),    // Registers current frame key state
        current_key_state: new Array(MAX_KEYBOARD_KEYS).fill(false),     // Registers previous frame key state
        key_repeat_in_frame: new Array(MAX_KEYBOARD_KEYS).fill(false),   // Registers key repeats for current frame.
        key_pressed_queue: new Array(MAX_KEY_PRESSED_QUEUE).fill(null),  // Input keys queue
        key_pressed_queue_count: 0,                                      // Input keys queue count
      };
    
      this.mouse = {
        offset: new THREE.Vector2(0.0, 0.0),
        scale: new THREE.Vector2(1.0, 1.0),
        current_position: new THREE.Vector2(0.0, 0.0),   // Mouse position on screen
        previous_position: new THREE.Vector2(0.0, 0.0),  // Previous mouse position
        movement: new THREE.Vector2(0.0, 0.0),
    
        is_locked: document.pointerLockElement === this.canvas_,

        // cursor_type: eMouseCursor.MC_CursorDefault,  // Tracks current mouse cursor
        // is_cursor_hidden: false,     // Track if cursor is hidden
        // is_cursor_on_screen: false,  // Tracks if cursor is inside client area
    
        previous_button_state: new Array(MAX_MOUSE_BUTTONS).fill(false),  // Registers current mouse button state
        current_button_state: new Array(MAX_MOUSE_BUTTONS).fill(false),   // Registers previous mouse button state
        previous_wheel_move: new THREE.Vector2(0.0, 0.0),  // Registers current mouse wheel variation
        current_wheel_move: new THREE.Vector2(0.0, 0.0),   // Registers previous mouse wheel variation
      };
    
      // this.touch = {
      //   point_count: 0,                                     // Number of touch points active
      //   point_id: new Array(MAX_TOUCH_POINTS),              // Point identifiers
      //   position: new Array(MAX_TOUCH_POINTS).fill(new THREE.Vector2(0.0, 0.0)),  // Touch position on screen (Vector2)
      //   current_touch_state: new Array(MAX_TOUCH_POINTS).fill(false),   // Registers current touch state
      //   previous_touch_state: new Array(MAX_TOUCH_POINTS).fill(false),  // Registers previous touch state
      // };
    
      // this.gamepad = {
      //   last_button_pressed: eGamepadButton.GB_Unknown,  // Register last gamepad button pressed
      //   axis_count: 0,  // Register number of available gamepad axis  // new Array(MAX_GAMEPADS),
      //   ready: false,   // Flag to know if gamepad is ready  // new Array(MAX_GAMEPADS),
      //   name: null,     // Gamepad name holder (string)  // new Array[MAX_GAMEPADS],
      //   previous_button_state: new Array(MAX_GAMEPAD_BUTTONS).fill(false), // Previous gamepad buttons state  // new Array(MAX_GAMEPADS).fill(new Array(MAX_GAMEPAD_BUTTONS)),  
      //   current_button_state: new Array(MAX_GAMEPAD_BUTTONS).fill(false),  // Current gamepad buttons state  // new Array(MAX_GAMEPADS).fill(new Array(MAX_GAMEPAD_BUTTONS)),   
      //   axis_state: new Array(MAX_GAMEPAD_AXIS).fill(0.0),  // Gamepad axis state  // new Array(MAX_GAMEPADS).fill(new Array(MAX_GAMEPAD_AXIS),
      // };

      document.onkeydown = this.on_key_down_.bind(this);
      document.onkeyup = this.on_key_up_.bind(this);
      document.onmousemove = this.on_mouse_move_.bind(this);
      document.onwheel = this.on_wheel_.bind(this);
      document.onmousedown = this.on_mouse_down_.bind(this);
      document.onmouseup = this.on_mouse_up_.bind(this);

      this.canvas_.onclick = this.on_click_.bind(this);

      document.onpointerlockchange = this.on_pointerlock_change_.bind(this);
    }

    /*
     * Input-related functions: keyboard
     */
    is_key_pressed(keyboard_key) { return !this.keyboard.previous_key_state[keyboard_key] && 
                                          this.keyboard.current_key_state[keyboard_key]; }    // Check if a key has been pressed once
    is_key_released(keyboard_key) { return this.keyboard.previous_key_state[keyboard_key] && 
                                           !this.keyboard.current_key_state[keyboard_key]; }  // Check if a key has been released once
    is_key_down(keyboard_key) { return this.keyboard.current_key_state[keyboard_key]; }          // Check if a key is being pressed
    is_key_up(keyboard_key) { return !this.keyboard.current_key_state[keyboard_key]; }              // Check if a key is NOT being pressed
    is_key_pressed_repeat(keyboard_key) { return this.keyboard.key_repeat_in_frame[keyboard_key]; }
    get_key_pressed()  // Get key pressed (keycode), call it multiple times for keys queued, returns 0 when the queue is empty
    {
      if (this.key_pressed_queue_count > 0)
      {
        // Get key from the queue head
        const key = this.keyboard.key_pressed_queue[0];

        // Shift elements 1 step toward the head
        for (let i = 0; i < (this.keyboard.key_pressed_queue_count - 1); ++i)
        {
          this.keyboard.key_pressed_queue[i] = this.keyboard.key_pressed_queue[i + 1];
        }

        // Reset last character in the queue
        this.keyboard.key_pressed_queue[this.keyboard.key_pressed_queue_count - 1] = null;
        this.keyboard.key_pressed_queue_count--;

        return key;
      }

      return null;
    }

    /*
     * Input-related functions: mouse
     */
    is_mouse_button_pressed(mouse_button)
    {
      return !this.mouse.previous_button_state[mouse_button] && 
              this.mouse.current_button_state[mouse_button];
    }
    is_mouse_button_released(mouse_button)
    {
      return this.mouse.previous_button_state[mouse_button] && 
            !this.mouse.current_button_state[mouse_button];
    }
    is_mouse_button_down(mouse_button)
    {
      return this.mouse.current_button_state[mouse_button];
    }
    is_mouse_button_up(mouse_button)
    {
      return !this.mouse.current_button_state[mouse_button];
    }
    get_mouse_x()
    {
      return ~((this.mouse.current_position.x + this.mouse.offset.x) * this.mouse.scale.x);
    }
    get_mouse_y()
    {
      return ~((this.mouse.current_position.y + this.mouse.offset.y) * this.mouse.scale.y);
    }
    get_mouse_position(out_pos)
    {
      out_pos.x = this.get_mouse_x()
      out_pos.y = this.get_mouse_y()
    }
    get_mouse_delta(out_delta)
    {
      if (this.mouse.is_locked)
      {
        out_delta.x = this.mouse.movement.x;
        out_delta.y = this.mouse.movement.y;
      }
      else
      {
        out_delta.x = this.mouse.current_position.x - this.mouse.previous_position.x;
        out_delta.y = this.mouse.current_position.y - this.mouse.previous_position.y;
      }
    }
    get_mouse_wheel_move(out_move)
    {
      out_move.x = this.mouse.current_wheel_move.x;
      out_move.y = this.mouse.current_wheel_move.y;
    }
    // void set_mouse_position(s32 x, s32 y) { SetMousePosition(x, y); }                                  // Set mouse position XY
    set_mouse_offset(x_offset, y_offset)
    {
      this.mouse.offset.x = x_offset;
      this.mouse.offset.y = y_offset;
    }
    set_mouse_scale(x_scale, y_scale)
    {
      this.mouse.scale.x = x_scale;
      this.mouse.scale.y = y_scale;
    }
    // void set_mouse_cursor(eMouseCursor cursor) { SetMouseCursor((s32)cursor); }                        // Set mouse cursor

    /*
     * Internal
     */

    reset_()
    {
      // Reset keys/chars pressed registered
      this.keyboard.key_pressed_queue_count = 0;

      // Register previous keys states
      for (let i = 0; i < MAX_KEYBOARD_KEYS; ++i)
      {
        this.keyboard.previous_key_state[i] = this.keyboard.current_key_state[i];
        this.keyboard.key_repeat_in_frame[i] = 0;
      }

      // Register previous mouse button states
      for (let i = 0; i < MAX_MOUSE_BUTTONS; ++i)
      {
        this.mouse.previous_button_state[i] = this.mouse.current_button_state[i];
      }

      this.mouse.previous_position.copy(this.mouse.current_position);
      this.mouse.previous_wheel_move.copy(this.mouse.current_wheel_move);
      this.mouse.previous_wheel_move.copy(this.mouse.current_wheel_move);

      this.mouse.movement.set(0.0, 0.0);
    }

    on_key_down_(e)
    {
      // TODO: There is better solution to this
      const is_letter = (c) => { return c.length === 1 && c.toLowerCase() != c.toUpperCase(); }
      const event_key = is_letter(e.key) ? e.key.toLowerCase() : e.key;

      assert(event_key in KeyboardEventKeys, `'${event_key}' was not found in KeyboardEventKeys.`);

      const key_index = KeyboardEventKeys[event_key];
      this.keyboard.current_key_state[key_index] = true;
      this.keyboard.key_repeat_in_frame[key_index] = e.repeat;

      if (this.keyboard.previous_key_state[key_index] == false)
      {
          if (this.keyboard.key_pressed_queue_count < MAX_KEY_PRESSED_QUEUE)
          {
              // Add key to the queue
              this.keyboard.key_pressed_queue[this.keyboard.key_pressed_queue_count] = key_index;
              this.keyboard.key_pressed_queue_count++;
          }
      }
    }

    on_key_up_(e)
    {
      // TODO: There is better solution to this
      const is_letter = (c) => { return c.length === 1 && c.toLowerCase() != c.toUpperCase(); }
      const event_key = is_letter(e.key) ? e.key.toLowerCase() : e.key;
      
      assert(event_key in KeyboardEventKeys, `'${event_key}' was not found in KeyboardEventKeys.`);

      const key_index = KeyboardEventKeys[event_key];
      this.keyboard.current_key_state[key_index] = false;
    }

    on_mouse_move_(e)
    {
      this.mouse.current_position.x = e.clientX;
      this.mouse.current_position.y = e.clientY;

      this.mouse.movement.x = e.movementX;
      this.mouse.movement.y = e.movementY;
    }

    on_wheel_(e)
    {
      this.mouse.current_wheel_move.x = e.deltaX;
      this.mouse.current_wheel_move.y = e.deltaY;
    }

    on_mouse_down_(e)
    {
      for (let i = 0; i < MAX_MOUSE_BUTTONS; ++i)
      {
        this.mouse.current_button_state[i] = Boolean(e.buttons & (1 << i));
      }
    }

    on_mouse_up_(e)
    {
      for (let i = 0; i < MAX_MOUSE_BUTTONS; ++i)
      {
        this.mouse.current_button_state[i] = Boolean(e.buttons & (1 << i));
      }
    }

    on_pointerlock_change_(e)
    {
      this.mouse.is_locked = document.pointerLockElement === this.canvas_;
    }

    async on_click_(e)
    {
      const canvas = this.canvas_;
      const promise = canvas.requestPointerLock({
        unadjustedMovement: true,
      });
    
      if (!promise)
      {
        log.debug("disabling mouse acceleration is not supported");
        return;
      }
    
      return promise
        .catch((error) => {
          if (error.name === "NotSupportedError") {
            // Some platforms may not support unadjusted movement.
            // You can request again a regular pointer lock.
            return canvas.requestPointerLock();
          }
        });
    }
  };

  return {
    InputComponent: InputComponent,
  };

})();
