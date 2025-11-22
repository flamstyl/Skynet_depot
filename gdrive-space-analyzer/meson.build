project('gdrive-space-analyzer',
  version: '1.0.0',
  meson_version: '>= 0.62.0',
  license: 'GPL-3.0-or-later',
)

python = import('python')
py_installation = python.find_installation('python3', required: true, modules: ['gi'])

prefix = get_option('prefix')
bindir = prefix / get_option('bindir')
datadir = prefix / get_option('datadir')
pkgdatadir = datadir / meson.project_name()

# Install Python modules
install_subdir('src', install_dir: py_installation.get_install_dir())

# Install data files
install_subdir('data', install_dir: pkgdatadir)

# Install desktop file and icon
# install_data('data/com.github.gdrive-analyzer.desktop', install_dir: datadir / 'applications')
# install_data('data/icons/com.github.gdrive-analyzer.svg', install_dir: datadir / 'icons/hicolor/scalable/apps')

# GSettings schema
# install_data('data/com.github.gdrive-analyzer.gschema.xml', install_dir: datadir / 'glib-2.0/schemas')

# Create launcher script
configure_file(
  input: 'gdrive-analyzer.in',
  output: 'gdrive-analyzer',
  configuration: {
    'PYTHON': py_installation.full_path(),
    'pkgdatadir': pkgdatadir,
  },
  install: true,
  install_dir: bindir
)

summary({
  'prefix': prefix,
  'bindir': bindir,
  'datadir': datadir,
}, section: 'Directories')
