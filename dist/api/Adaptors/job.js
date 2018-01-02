/*jshint esversion: 6 */
'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true,
});

var _createClass = function() {
  function defineProperties(target, props) {
    for (var i = 0; i < props.length; i++) {
      var descriptor = props[i];
      descriptor.enumerable = descriptor.enumerable || false;
      descriptor.configurable = true;
      if ('value' in descriptor) descriptor.writable = true;
      Object.defineProperty(target, descriptor.key, descriptor);
    }
  }

  return function(Constructor, protoProps, staticProps) {
    if (protoProps) defineProperties(Constructor.prototype, protoProps);
    if (staticProps) defineProperties(Constructor, staticProps);
    return Constructor;
  };
}();

function _classCallCheck(instance, Constructor) {
  if (!(instance instanceof Constructor)) {
    throw new TypeError('Cannot call a class as a function');
  }
}

var JobAdaptor = function() {
  function JobAdaptor(modals) {
    _classCallCheck(this, JobAdaptor);

    this.modals = modals;
  }

  _createClass(JobAdaptor, [
    {
      key: 'createJobs',
      value: function createJobs(jobDetail) {
        return this.modals.jobs.create(jobDetail).then(function(jobResult) {
          return jobResult.toJSON();
        });
      },
    }, {
      key: 'createJobCopies',
      value: function createJobCopies(copyDetail) {
        return this.modals.jobCopies.create(copyDetail).
            then(function(copyResult) {
              return copyResult.toJSON();
            });
      },
    }, {
      key: 'retrieveJobDetail',
      value: function retrieveJobDetail(id) {
        return Promise.all([
          this.modals.jobs.findById(id),
          this.modals.products.findOne(
              {where: {job_id: id}, attributes: ['id']})]).
            then(function(jobResult) {
              jobResult[0].updateAttributes({
                admin_status: 4,
              });
              var jobDetail = jobResult[0].toJSON();
              var productDetail = jobResult[1].toJSON();
              jobDetail.productId = productDetail.id;
              return jobDetail;
            });
      },
    }]);

  return JobAdaptor;
}();

exports.default = JobAdaptor;