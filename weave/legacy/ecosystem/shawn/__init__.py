from weave.legacy import context_state as _context

_loading_builtins_token = _context.set_loading_built_ins()

from weave.legacy.ecosystem.shawn import petdataset, scratch

_context.clear_loading_built_ins(_loading_builtins_token)
