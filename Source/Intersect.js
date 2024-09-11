import * as THREE from 'three';


export const intersect = (() => {

  const EPSILON = Number.EPSILON;

  let d = new THREE.Vector3();
  let m = new THREE.Vector3();
  let n = new THREE.Vector3();

  // As described in "Real-Time Collision Detection, Ericson Christer"
  function segment_cylinder(sa, sb, p, q, r)
  {
    let res = {
      intersects: false,
      t: 0.0,
    };

    d.copy(q).sub(p);
    m.copy(sa).sub(p);
    n.copy(sb).sub(sa);

    const md = m.dot(d);
    const nd = n.dot(d);
    const dd = d.dot(d);

    // Test if segment fully outside either endcap of cylinder
    if (md < 0.0 && md + nd < 0.0)
    {
      // Segment outside ’p’ side of cylinder if (md > dd && md + nd > dd) return 0; 
      return res;
    }
    if (md > dd && md + nd > dd)
    {
      // Segment outside ’q’ side of cylinder float nn = Dot(n, n);
      return res;
    }

    const nn = n.dot(n);
    const mn = m.dot(n);
    const a = dd * nn - nd * nd;
    const k = m.dot(m) - r * r;
    const c = dd * k - md * md;
      
    if (Math.abs(a) < EPSILON) {
      // Segment runs parallel to cylinder axis
      if (c > 0.0)
      {
        // ’a’ and thus the segment lie outside cylinder
        return res;
      }

      // Now known that segment intersects cylinder; figure out how it intersects
      if (md < 0.0)
      {
        // Intersect segment against ’p’ endcap
        res.t = -mn / nn;
      }
      else if (md > dd)
      {
        // Intersect segment against ’q’ endcap 
        res.t = (nd - mn) / nn;
      }
      else
      {
        res.t = 0.0; // ’a’ lies inside cylinder
      }

      res.intersects = true;
      return res;
    }

    const b = dd * mn - nd * md;
    const discr = b * b - a * c;

    if (discr < 0.0)
    {
      // No real roots; no intersection
      return res;
    }

    res.t = (-b - Math.sqrt(discr)) / a;

    if (res.t < 0.0 || res.t > 1.0)
    {
      return res; // Intersection lies outside segment
    }

    if (md + res.t * nd < 0.0)
    {
      // Intersection outside cylinder on ’p’ side
      if (nd <= 0.0)
      {
        // Segment pointing away from endcap
        return res;
      }

      res.t = -md / nd;

      // Keep intersection if Dot(S(t) - p, S(t) - p) <= r 2
      res.intersects = k + 2 * res.t * (mn + res.t * nn) <= 0.0;

      return res;
    }
    else if (md + res.t * nd > dd)
    {
      // Intersection outside cylinder on ’q’ side
      if (nd >= 0.0)
      {
        return res; // Segment pointing away from endcap
      }
        
      res.t = (dd - md) / nd;

      // Keep intersection if Dot(S(t) - q, S(t) - q) <= r 2
      res.intersects = k + dd - 2 * md + res.t * (2 * (mn - nd) + res.t * nn) <= 0.0;
      return res;
    }
    
    // Segment intersects cylinder between the endcaps; t is correct
    res.intersects = true;
    return res;
  }

  return {
    segment_cylinder: segment_cylinder,
  };

})();