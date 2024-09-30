

// TODO: CombatManager
//   - Hex Grid (on navmesh)
//   - Update Zones depending on player position
//   - Assign agents to grid positions

/*
- Grid needs to be static, it is placed and does not move at runtime
- only zones are updated from player position
- grid position is identified by Tulpe index
- World position is obtained from grid index
- manager needs to keep track of 
    - agent -> grid position assignment
    - zone -> grid_position

zone0: not in view
zone1: danger zone
zone2: safe zone
zone3: far zone

- build(origin, nav_mesh)
- update_zones(player_position)
- alloc_grid_position(zone_id, closest_position = null)
- free_grid_position(grid_x, grid_y)
- get_world_position(grid_x, grid_y)
- get_zone(grid_x, grid_y)
- 

Enemy Attack Tickets
- Player has attack slots
- Different attacks have costs
- e.g. 3 low level attacks (cost 1) vs 1 big attack (cost 3)
- cost is reserver pre-attack, post-attack it is freed
*/