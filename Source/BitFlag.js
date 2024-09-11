

class BitFlag
{
  // Constructor initializes the value to 0
  constructor()
  {
    this.value_ = 0;
  }

  clear()
  {
    this.value_ = 0;
  }

  // Sets a flag to true
  set(flag) {
    this.value_ |= flag;
  }

  // Returns the current value
  get() {
    return this.value_;
  }

  // Sets a flag to false
  unset(flag) {
    this.value_ &= ~flag;
  }

  // Toggles the flag value from true to false and vice versa
  flip(flag) {
    this.value_ ^= flag;
  }

  // Checks whether a flag is set to true
  is_set(flag) {
    return (this.value_ & flag) === flag;
  }
}

export { BitFlag };
