iD.ui.save = function(context) {
    return function (selection) {
        var map = context.map(),
            history = context.history(),
            connection = context.connection(),
            tooltip = bootstrap.tooltip()
                .placement('bottom');

        function success(e, changeset_id) {
            var modal = iD.ui.modal(context.container());
            modal.select('.content')
                .classed('success-modal', true)
                .datum({
                    id: changeset_id,
                    comment: e.comment
                })
                .call(iD.ui.success(connection)
                    .on('cancel', function() {
                        modal.remove();
                    }));
        }

        function clickFix(d) {
            map.extent(d.entity.extent(context.graph()));
            if (map.zoom() > 19) map.zoom(19);
            context.enter(iD.modes.Select(context, [d.entity.id]));
            modal.remove();
        }

        function click() {

            function commit(e) {
                context.container().select('.shaded').remove();
                var l = iD.ui.loading(context.container(), t('uploading_changes'), true);

                connection.putChangeset(history.changes(),
                    e.comment,
                    history.imagery_used(), function(err, changeset_id) {
                    l.remove();
                    history.reset();
                    map.flush().redraw();
                    if (err) {
                        var desc = iD.ui.confirm()
                            .select('.description');
                        desc.append('h2')
                            .text(t('save_error'));
                        desc.append('p').text(err.responseText);
                    } else {
                        success(e, changeset_id);
                    }
                });
            }

            if (history.hasChanges()) {
                connection.authenticate(function(err) {
                    var modal = iD.ui.modal(context.container());
                    var changes = history.changes();
                    changes.connection = connection;
                    modal.select('.content')
                        .classed('commit-modal', true)
                        .datum(changes)
                        .call(iD.ui.commit(context)
                            .on('cancel', function() {
                                modal.remove();
                            })
                            .on('fix', clickFix)
                            .on('save', commit));
                });
            } else {
                iD.ui.confirm().select('.description')
                    .append('h3').text(t('no_changes'));
            }
        }

        selection.html("<span class='label'>" + t('save') + "</span><small id='as-username'></small>")
            .attr('title', t('save_help'))
            .attr('tabindex', -1)
            .property('disabled', true)
            .call(tooltip)
            .on('click', click);

        selection.append('span')
            .attr('class', 'count');

        history.on('change.save-button', function() {
            var hasChanges = history.hasChanges();

            selection
                .property('disabled', !hasChanges)
                .classed('has-count', hasChanges)
                .select('span.count')
                    .text(history.numChanges());

            if (!hasChanges) {
                selection.call(tooltip.hide);
            }
        });
    };
};
